import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
	server: {
		DATABASE_URL: z.string().min(1),
		CLERK_SECRET_KEY: z.string().min(1),
		LAYERD_API_KEY: z.string().min(1).default("local-layerd-key"),
		LAYERD_API_URL: z.url().default("http://127.0.0.1:8000"),
		NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
	},
	runtimeEnv: process.env,
	skipValidation: !!process.env.SKIP_ENV_VALIDATION,
	emptyStringAsUndefined: true,
});
