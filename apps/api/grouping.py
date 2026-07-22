import base64
import io
import json
import math
import os
from dataclasses import dataclass
from typing import Any, Literal

from openai import OpenAI
from PIL import Image, ImageDraw, ImageOps
from pydantic import BaseModel, Field, ValidationError


Role = Literal[
    "background",
    "headline",
    "body",
    "logo",
    "product",
    "illustration",
    "decoration",
    "cta",
]


class LayerGroup(BaseModel):
    role: Role
    layer_ids: list[int] = Field(min_length=1)


class GroupPlan(BaseModel):
    groups: list[LayerGroup] = Field(min_length=1, max_length=8)


@dataclass
class GroupingInput:
    source: Image.Image
    elements: list[dict[str, Any]]
    canvas_size: tuple[int, int]
    svg: str


def make_contact_sheet(elements: list[dict[str, Any]]) -> Image.Image:
    columns = max(1, math.ceil(math.sqrt(len(elements))))
    rows = math.ceil(len(elements) / columns)
    cell_width = 220
    cell_height = 180
    sheet = Image.new("RGB", (columns * cell_width, rows * cell_height), "white")
    draw = ImageDraw.Draw(sheet)

    for index, element in enumerate(elements):
        x = index % columns * cell_width
        y = index // columns * cell_height
        draw.rectangle((x, y, x + cell_width - 1, y + cell_height - 1), outline="#cbd5e1")
        draw.rectangle((x, y, x + cell_width - 1, y + 25), fill="#0f172a")
        draw.text((x + 8, y + 7), f'Layer {element["id"]}', fill="white")

        thumbnail = ImageOps.contain(element["image"].convert("RGBA"), (196, 138))
        left = x + (cell_width - thumbnail.width) // 2
        top = y + 31 + (143 - thumbnail.height) // 2
        sheet.paste(thumbnail, (left, top), thumbnail)

    return sheet


def image_data_url(image: Image.Image) -> str:
    prepared = image.convert("RGB")
    prepared.thumbnail((1536, 1536))
    buffer = io.BytesIO()
    prepared.save(buffer, format="JPEG", quality=82, optimize=True)
    encoded = base64.b64encode(buffer.getvalue()).decode("ascii")
    return f"data:image/jpeg;base64,{encoded}"


def layer_metadata(options: GroupingInput) -> str:
    width, height = options.canvas_size
    layers = []

    for element in options.elements:
        box = element["box"]
        layers.append(
            {
                "id": element["id"],
                "type": element["type"],
                "box": [box["x_min"], box["y_min"], box["x_max"], box["y_max"]],
            }
        )

    return json.dumps({"canvas": [width, height], "layers": layers})


def validate_plan(options: tuple[GroupPlan, set[int]]) -> str | None:
    plan, expected_ids = options
    assigned_ids = [layer_id for group in plan.groups for layer_id in group.layer_ids]

    if len(assigned_ids) != len(set(assigned_ids)):
        return "A layer ID was assigned to more than one group."
    if set(assigned_ids) != expected_ids:
        return f"Expected layer IDs {sorted(expected_ids)}, received {sorted(assigned_ids)}."
    return None


def request_group_plan(options: GroupingInput) -> GroupPlan:
    client = OpenAI()
    model = os.getenv("OPENAI_MODEL", "gpt-5.6-sol-medium")
    source_url = image_data_url(options.source)
    contact_sheet_url = image_data_url(make_contact_sheet(options.elements))
    metadata = layer_metadata(options)
    schema = json.dumps(GroupPlan.model_json_schema())
    correction = ""

    for _ in range(2):
        completion = client.chat.completions.create(
            model=model,
            response_format={"type": "json_object"},
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You group decomposed graphic-design layers into semantic animation units. "
                        "Use the complete design for context and the numbered contact sheet to map "
                        "visual meaning to layer IDs."
                    ),
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": (
                                "Group the layers into at most 8 semantic units. Every layer ID must "
                                "appear exactly once. Keep the full-canvas background separate. Group "
                                "words from one heading, pieces of one illustration, and CTA shapes, "
                                "text, or icons when they form one visual unit. Do not group items only "
                                "because they are nearby.\n\n"
                                f"Layer metadata: {metadata}\n\nResponse schema: {schema}{correction}"
                            ),
                        },
                        {
                            "type": "image_url",
                            "image_url": {"url": source_url, "detail": "high"},
                        },
                        {
                            "type": "image_url",
                            "image_url": {"url": contact_sheet_url, "detail": "high"},
                        },
                    ],
                },
            ],
        )
        content = completion.choices[0].message.content
        if content is None:
            raise RuntimeError("The grouping model did not return a plan")

        try:
            plan = GroupPlan.model_validate_json(content)
        except ValidationError as error:
            correction = f"\n\nYour previous response was invalid: {error}. Return corrected JSON."
            continue

        error = validate_plan((plan, {element["id"] for element in options.elements}))
        if error is None:
            return plan
        correction = f"\n\nYour previous plan was invalid: {error} Return a corrected complete plan."

    raise RuntimeError(correction.strip())


def embed_group_plan(options: tuple[str, GroupPlan]) -> str:
    svg, plan = options
    metadata = f'<metadata id="layer-groups">{plan.model_dump_json()}</metadata>'
    return svg.replace("</svg>", f"{metadata}</svg>", 1)


def group_svg(options: GroupingInput) -> str:
    plan = request_group_plan(options)
    return embed_group_plan((options.svg, plan))
