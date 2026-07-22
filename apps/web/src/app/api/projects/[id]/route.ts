import { auth } from "@clerk/nextjs/server";
import { db, projects } from "@fluexy-layerd/db";
import { and, eq } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const [project] = await db
    .select({
      filename: projects.filename,
      svg: projects.svg,
    })
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.userId, userId)))
    .limit(1);

  if (!project) return Response.json({ error: "Project not found" }, { status: 404 });

  return Response.json(project);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const [deletedProject] = await db
    .delete(projects)
    .where(and(eq(projects.id, id), eq(projects.userId, userId)))
    .returning({ id: projects.id });

  if (!deletedProject) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  return Response.json(deletedProject);
}
