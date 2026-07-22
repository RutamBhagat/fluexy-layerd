import { auth } from "@clerk/nextjs/server";
import { db, projects } from "@fluexy-layerd/db";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as {
    filename?: string;
    svg?: string;
  };

  if (!body.filename || !body.svg) {
    return Response.json({ error: "Missing project data" }, { status: 400 });
  }

  if (body.svg.length > 20_000_000) {
    return Response.json({ error: "SVG is too large to save" }, { status: 413 });
  }

  const [project] = await db
    .insert(projects)
    .values({
      userId,
      filename: body.filename,
      svg: body.svg,
    })
    .returning({ id: projects.id });

  return Response.json(project, { status: 201 });
}
