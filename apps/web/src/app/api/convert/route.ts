import { auth } from "@clerk/nextjs/server";
import { env } from "@fluexy-layerd/env/server";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const response = await fetch(`${env.LAYERD_API_URL}/convert`, {
      method: "POST",
      headers: { "X-API-Key": env.LAYERD_API_KEY },
      body: await request.formData(),
    });

    return new Response(response.body, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("Content-Type") ?? "text/plain",
      },
    });
  } catch {
    return Response.json({ error: "LayerD API is unavailable" }, { status: 502 });
  }
}
