import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { db, projects } from "@fluexy-layerd/db";
import { Button } from "@fluexy-layerd/ui/components/button";
import { Card, CardContent, CardTitle } from "@fluexy-layerd/ui/components/card";
import { desc, eq } from "drizzle-orm";

export default async function HistoryPage() {
  const { userId } = await auth();
  if (!userId) return null;

  const savedProjects = await db
    .select({
      id: projects.id,
      filename: projects.filename,
      svg: projects.svg,
      createdAt: projects.createdAt,
    })
    .from(projects)
    .where(eq(projects.userId, userId))
    .orderBy(desc(projects.createdAt));

  return (
    <main className="mx-auto min-h-svh w-full max-w-4xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">History</h1>
          <p className="text-sm text-muted-foreground">Reopen extracted layers without running LayerD again.</p>
        </div>
        <Button variant="outline" render={<Link href="/" />}>
          Back to studio
        </Button>
      </div>

      {savedProjects.length ? (
        <div className="grid gap-6 sm:grid-cols-2">
          {savedProjects.map((project) => (
            <Card key={project.id} className="gap-0 py-0">
              <Link
                href={`/?project=${project.id}`}
                className="group flex h-72 items-center justify-center overflow-hidden border-b bg-muted/30 outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <img
                  src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(project.svg)}`}
                  alt={`${project.filename} preview`}
                  className="h-full w-full object-contain transition-transform duration-200 group-hover:scale-[1.02] motion-reduce:transition-none"
                />
              </Link>
              <CardContent className="flex items-center gap-4 py-3">
                <div className="min-w-0 flex-1">
                  <CardTitle className="truncate text-base">{project.filename}</CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {project.createdAt.toLocaleString()}
                  </p>
                </div>
                <Button render={<Link href={`/?project=${project.id}`} />}>
                  Open
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="border p-8 text-center text-sm text-muted-foreground">
          No saved projects yet.
        </p>
      )}
    </main>
  );
}
