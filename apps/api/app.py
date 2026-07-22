import os
import secrets
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Annotated

import torch
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, File, Header, HTTPException, UploadFile
from fastapi.responses import Response
from layerd import LayerDPipeline
from openai import OpenAIError
from PIL import Image, UnidentifiedImageError

from .grouping import GroupingInput, group_svg


load_dotenv(Path(__file__).with_name(".env"))
pipeline: LayerDPipeline | None = None
layerd_api_key = os.getenv("LAYERD_API_KEY", "local-layerd-key")


def require_api_key(
    x_api_key: Annotated[str | None, Header()] = None,
) -> None:
    if not secrets.compare_digest(x_api_key or "", layerd_api_key):
        raise HTTPException(401, "Invalid API key")


@asynccontextmanager
async def lifespan(_: FastAPI):
    global pipeline

    device = os.getenv("LAYERD_DEVICE") or (
        "mps" if torch.backends.mps.is_available() else "cpu"
    )
    pipeline = LayerDPipeline(
        device=device,
        matting_process_size=(1024, 1024),
    )
    yield
    pipeline = None


app = FastAPI(lifespan=lifespan)


@app.post("/convert", dependencies=[Depends(require_api_key)])
def convert_image(
    image: Annotated[UploadFile, File()],
) -> Response:
    if pipeline is None:
        raise HTTPException(503, "LayerD is loading")

    try:
        source = Image.open(image.file).convert("RGBA")
    except (UnidentifiedImageError, OSError) as error:
        raise HTTPException(400, "Upload a valid image") from error

    result = pipeline(source, max_iterations=3)

    try:
        svg = group_svg(
            GroupingInput(
                source=source,
                elements=result.elements,
                canvas_size=result.canvas_size,
                svg=result.to_svg(),
            )
        )
    except (OpenAIError, RuntimeError) as error:
        raise HTTPException(502, "The AI grouping step failed") from error

    return Response(svg, media_type="image/svg+xml")
