import { db } from "@/db";
import { worlds } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";
const USER_ID = "demo-user";

type Context = { params: Promise<{ id: string }> };

function parseId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function GET(_: Request, { params }: Context) {
  const id = parseId((await params).id);
  if (!id) return Response.json({ error: "Invalid world id" }, { status: 400 });
  const [world] = await db.select().from(worlds).where(and(eq(worlds.id, id), eq(worlds.userId, USER_ID))).limit(1);
  return world ? Response.json(world) : Response.json({ error: "World not found" }, { status: 404 });
}

export async function PATCH(request: Request, { params }: Context) {
  const id = parseId((await params).id);
  if (!id) return Response.json({ error: "Invalid world id" }, { status: 400 });
  const body = await request.json();
  const allowed = {
    ...(typeof body.title === "string" ? { title: body.title.trim() || "Untitled World" } : {}),
    ...(typeof body.genre === "string" ? { genre: body.genre } : {}),
    ...(typeof body.description === "string" ? { description: body.description } : {}),
    ...(typeof body.coverColor === "string" ? { coverColor: body.coverColor } : {}),
    ...(body.canvas && Array.isArray(body.canvas.nodes) && Array.isArray(body.canvas.edges) ? { canvas: body.canvas } : {}),
    updatedAt: new Date(),
  };
  const [updated] = await db.update(worlds).set(allowed).where(and(eq(worlds.id, id), eq(worlds.userId, USER_ID))).returning();
  return updated ? Response.json(updated) : Response.json({ error: "World not found" }, { status: 404 });
}

export async function DELETE(_: Request, { params }: Context) {
  const id = parseId((await params).id);
  if (!id) return Response.json({ error: "Invalid world id" }, { status: 400 });
  const [deleted] = await db.delete(worlds).where(and(eq(worlds.id, id), eq(worlds.userId, USER_ID))).returning({ id: worlds.id });
  return deleted ? Response.json({ ok: true }) : Response.json({ error: "World not found" }, { status: 404 });
}
