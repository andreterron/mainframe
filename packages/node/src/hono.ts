import { getRequestListener } from "@hono/node-server";
import { env } from "./lib/env.server.ts";
import { Env as ApiEnv, ApiRouterHooks } from "@mainframe-so/server";
import express from "express";
import { createMainframeAPI } from "@mainframe-so/server";

type Env = ApiEnv & {
  // Based on import("@hono/node-server").HttpBindings
  Bindings: {
    incoming: express.Request;
    outgoing: express.Response;
  };
};

export const createHonoRequestListener = (config: Partial<ApiRouterHooks>) => {
  const hono = createMainframeAPI<Env>({
    getRequestDB(c) {
      return c.env.incoming.db;
    },
    ...config,
  });

  return getRequestListener(hono.fetch, {
    hostname: new URL(env.VITE_API_URL).hostname,
  });
};
