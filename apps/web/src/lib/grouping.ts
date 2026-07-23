import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { env } from "@fluexy-layerd/env/server";
import { DOMParser, XMLSerializer } from "@xmldom/xmldom";
import { generateText, Output } from "ai";
import sharp from "sharp";
import { z } from "zod";

const svgNamespace = "http://www.w3.org/2000/svg";

const roleSchema = z.enum([
	"background",
	"headline",
	"body",
	"logo",
	"product",
	"illustration",
	"decoration",
	"cta",
]);

const groupPlanSchema = z.object({
	groups: z
		.array(
			z.object({
				role: roleSchema,
				layer_ids: z.array(z.number().int()).min(1),
			}),
		)
		.min(1),
});

const boxSchema = z.object({
	x_min: z.number(),
	y_min: z.number(),
	x_max: z.number(),
	y_max: z.number(),
});

const groupingInputSchema = z.object({
	svg: z.string(),
	canvas_size: z.tuple([z.number(), z.number()]),
	elements: z
		.array(
			z.object({
				id: z.number().int(),
				type: z.string(),
				box: boxSchema,
				image: z.string().regex(/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/),
			}),
		)
		.min(1),
});

type GroupPlan = z.infer<typeof groupPlanSchema>;
type GroupingInput = z.infer<typeof groupingInputSchema>;

const provider = createOpenAICompatible({
	name: "local-proxy",
	apiKey: env.OPENAI_API_KEY,
	baseURL: env.OPENAI_BASE_URL,
	supportsStructuredOutputs: true,
});
const groupingModel = provider(env.OPENAI_MODEL);

async function imageDataUrl(image: Buffer): Promise<string> {
	const prepared = await sharp(image)
		.flatten({ background: "white" })
		.resize({
			width: 1536,
			height: 1536,
			fit: "inside",
			withoutEnlargement: true,
		})
		.jpeg({ quality: 82 })
		.toBuffer();

	return `data:image/jpeg;base64,${prepared.toString("base64")}`;
}

async function makeContactSheet(elements: GroupingInput["elements"]): Promise<string> {
	const columns = Math.max(1, Math.ceil(Math.sqrt(elements.length)));
	const rows = Math.ceil(elements.length / columns);
	const cellWidth = 220;
	const cellHeight = 180;
	const cells = elements.map((element, index) => {
		const x = (index % columns) * cellWidth;
		const y = Math.floor(index / columns) * cellHeight;
		return `<g transform="translate(${x} ${y})">
			<rect width="219" height="179" fill="white" stroke="#cbd5e1"/>
			<rect width="219" height="25" fill="#0f172a"/>
			<text x="8" y="17" fill="white" font-family="sans-serif" font-size="12">Layer ${element.id}</text>
			<image href="${element.image}" x="12" y="31" width="196" height="138" preserveAspectRatio="xMidYMid meet"/>
		</g>`;
	});
	const sheet = `<svg xmlns="${svgNamespace}" width="${columns * cellWidth}" height="${rows * cellHeight}">${cells.join("")}</svg>`;
	const jpeg = await sharp(Buffer.from(sheet)).jpeg({ quality: 82 }).toBuffer();

	return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
}

function layerMetadata(input: GroupingInput): string {
	return JSON.stringify({
		canvas: input.canvas_size,
		layers: input.elements.map((element) => ({
			id: element.id,
			type: element.type,
			box: [
				element.box.x_min,
				element.box.y_min,
				element.box.x_max,
				element.box.y_max,
			],
		})),
	});
}

function validatePlan(options: {
	plan: GroupPlan;
	input: GroupingInput;
}): string | null {
	const { plan, input } = options;
	const [width, height] = input.canvas_size;
	const expectedIds = new Set(input.elements.map((element) => element.id));
	const backgroundIds = new Set(
		input.elements
			.filter(
				(element) =>
					element.box.x_min <= 1 &&
					element.box.y_min <= 1 &&
					element.box.x_max - element.box.x_min >= width * 0.98 &&
					element.box.y_max - element.box.y_min >= height * 0.98,
			)
			.map((element) => element.id),
	);
	const assignedIds = plan.groups.flatMap((group) => group.layer_ids);

	if (
		assignedIds.length !== expectedIds.size ||
		new Set(assignedIds).size !== expectedIds.size ||
		assignedIds.some((id) => !expectedIds.has(id))
	)
		return "Every layer ID must appear exactly once.";

	for (const group of plan.groups) {
		const hasBackground = group.layer_ids.some((id) => backgroundIds.has(id));
		const hasForeground = group.layer_ids.some((id) => !backgroundIds.has(id));

		if (hasBackground && hasForeground)
			return "Background layers must not be grouped with foreground layers.";
		if (backgroundIds.size && hasBackground !== (group.role === "background"))
			return "Only full-canvas layers may use the background role.";
	}

	return null;
}

async function requestGroupPlan(options: {
	source: Buffer;
	input: GroupingInput;
}): Promise<GroupPlan> {
	const { source, input } = options;
	const sourceUrl = await imageDataUrl(source);
	const contactSheetUrl = await makeContactSheet(input.elements);
	const metadata = layerMetadata(input);
	const { output } = await generateText({
		model: groupingModel,
		system:
			"You group decomposed graphic-design layers into semantic animation units. Use the complete design for context and the numbered contact sheet to map visual meaning to layer IDs.",
		output: Output.object({ schema: groupPlanSchema }),
		messages: [
			{
				role: "user",
				content: [
					{
						type: "text",
						text:
							"Group the layers into animation units. Every layer ID must appear exactly once. Keep the full-canvas background separate. Text must animate independently from its surrounding section: group only words or fragments from the same text block, and never group text with panels, cards, button shapes, images, illustrations, or decorations. Group pieces of one non-text illustration when they form one visual unit. Do not group an entire poster section or group items only because they are nearby.\n\n" +
							`Layer metadata: ${metadata}`,
					},
					{ type: "file", data: sourceUrl, mediaType: "image/jpeg" },
					{ type: "file", data: contactSheetUrl, mediaType: "image/jpeg" },
				],
			},
		],
		maxRetries: 1,
	});
	const error = validatePlan({ plan: output, input });
	if (error) throw new Error(error);
	return output;
}

function embedGroupPlan(options: { svg: string; plan: GroupPlan }): string {
	const document = new DOMParser({
		onError: (level, message) => {
			if (level !== "warning") throw new Error(message);
		},
	}).parseFromString(options.svg, "image/svg+xml");
	const root = document.documentElement;
	if (!root || root.localName !== "svg")
		throw new Error("LayerD returned an invalid SVG");

	const existing = document.getElementById("layer-groups");
	if (existing?.parentNode) existing.parentNode.removeChild(existing);

	const metadata = document.createElementNS(svgNamespace, "metadata");
	metadata.setAttribute("id", "layer-groups");
	metadata.appendChild(document.createTextNode(JSON.stringify(options.plan)));
	root.appendChild(metadata);

	return new XMLSerializer().serializeToString(document);
}

export async function groupSvg(options: {
	source: Buffer;
	payload: unknown;
}): Promise<string> {
	const input = groupingInputSchema.parse(options.payload);
	const plan = await requestGroupPlan({ source: options.source, input });
	return embedGroupPlan({ svg: input.svg, plan });
}
