import { db } from "@/db";
import { worlds } from "@/db/schema";
import { instantiateTemplate, starterCanvas, worldTemplates } from "@/lib/story-data";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";
const USER_ID = "demo-user";

const byId = (id: string) => worldTemplates.find((template) => template.id === id)!;

const samples = [
  { title: "The Ember Kingdoms", genre: "Epic Fantasy", description: "A realm of ash-bound crowns, sentient forests, and forgotten stars.", coverColor: "ember", canvas: starterCanvas() },
  { title: "Orbits of Veyra", genre: "Science Fiction", description: "Frontier colonies circle a dying blue giant at the edge of known space.", coverColor: "cosmos", canvas: instantiateTemplate(byId("scifi-system")) },
  { title: "Salt & Silver", genre: "Dark Fantasy", description: "Island city-states bargain with old gods beneath the midnight tide.", coverColor: "ocean", canvas: instantiateTemplate(byId("coastal-network")) },
  { title: "The Hollow Meridian", genre: "Weird West", description: "A broken railway crosses towns erased from every map but one.", coverColor: "desert", canvas: instantiateTemplate(byId("fantasy-realm")) },
];

export async function GET() {
  let rows = await db.select().from(worlds).where(eq(worlds.userId, USER_ID)).orderBy(desc(worlds.updatedAt));
  if (!rows.length) {
    rows = await db.insert(worlds).values(samples.map((item) => ({
      ...item,
      userId: USER_ID,
    }))).returning();
  }
  return Response.json(rows);
}

export async function POST(request: Request) {
  const body = await request.json();
  const title = String(body.title ?? "Untitled World").trim() || "Untitled World";
  const [created] = await db.insert(worlds).values({
    userId: USER_ID,
    title,
    genre: String(body.genre ?? "Fantasy"),
    description: String(body.description ?? "A new world waiting to be discovered."),
    coverColor: String(body.coverColor ?? "violet"),
    canvas: { nodes: [], edges: [] },
  }).returning();
  return Response.json(created, { status: 201 });
}
