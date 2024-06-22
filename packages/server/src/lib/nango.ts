import { Nango } from "@nangohq/node";
import { env } from "./env.server.ts";

export const nango = env.NANGO_PRIVATE_KEY
  ? new Nango({ secretKey: env.NANGO_PRIVATE_KEY })
  : undefined;
