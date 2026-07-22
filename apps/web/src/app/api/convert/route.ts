import { auth } from "@clerk/nextjs/server";
import { env } from "@fluexy-layerd/env/server";
import { groupSvg } from "@/lib/grouping";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const image = formData.get("image");
  if (!(image instanceof File))
    return Response.json({ error: "Upload an image" }, { status: 400 });

  let response: Response;
  try {
    response = await fetch(`${env.LAYERD_API_URL}/convert`, {
      method: "POST",
      headers: { "X-API-Key": env.LAYERD_API_KEY },
      body: formData,
    });
  } catch {
    return Response.json({ error: "LayerD API is unavailable" }, { status: 502 });
  }

  if (!response.ok)
    return new Response(response.body, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("Content-Type") ?? "text/plain",
      },
    });

  try {
    const svg = await groupSvg({
      source: Buffer.from(await image.arrayBuffer()),
      payload: await response.json(),
    });
    return new Response(svg, { headers: { "Content-Type": "image/svg+xml" } });
  } catch {
    return Response.json({ error: "The AI grouping step failed" }, { status: 502 });
  }
}
