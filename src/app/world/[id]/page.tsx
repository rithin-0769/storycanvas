import { db } from "@/db";
import { worlds } from "@/db/schema";
import WorldCanvas from "@/components/world-canvas";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function WorldPage({ params }: Props) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) notFound();
  const [world] = await db.select().from(worlds).where(and(eq(worlds.id, id), eq(worlds.userId, "demo-user"))).limit(1);
  if (!world) notFound();

  return <WorldCanvas world={{ id: world.id, title: world.title, genre: world.genre, description: world.description, canvas: world.canvas as Parameters<typeof WorldCanvas>[0]["world"]["canvas"] }} />;
}
