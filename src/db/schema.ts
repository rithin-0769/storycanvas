import { jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export type CanvasState = {
  nodes: Array<Record<string, unknown>>;
  edges: Array<Record<string, unknown>>;
};

export const worlds = pgTable("worlds", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().default("demo-user"),
  title: text("title").notNull(),
  genre: text("genre").notNull().default("Fantasy"),
  description: text("description").notNull().default(""),
  coverColor: text("cover_color").notNull().default("violet"),
  canvas: jsonb("canvas").$type<CanvasState>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type World = typeof worlds.$inferSelect;
export type NewWorld = typeof worlds.$inferInsert;
