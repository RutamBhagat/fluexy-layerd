import { env } from "@fluexy-layerd/env/server";
import * as schema from "./schema";

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

export { projects } from "./schema";

export function createDb() {
	const sql = neon(env.DATABASE_URL);
	return drizzle(sql, { schema });
}

export const db = createDb();
