import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const projects = pgTable("projects", {
  id: uuid().defaultRandom().primaryKey(),
  userId: text().notNull(),
  filename: text().notNull(),
  svg: text().notNull(),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
});
