import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { env } from "./env.server.ts";
import * as schema from "../db/connect-db/connect-schema.ts";

export const connectDB =
  env.CONNECT_DB_URL && env.CONNECT_DB_TOKEN
    ? drizzle(
        createClient({
          url: env.CONNECT_DB_URL,
          authToken: env.CONNECT_DB_TOKEN,
        }),
        { schema },
      )
    : undefined;
