import { getRequestListener } from "@hono/node-server";
import { env } from "./lib/env.server.ts";
import { Env as ApiEnv, MainframeAPIOptions } from "@mainframe-so/server";
import express from "express";
import { createMainframeAPI } from "@mainframe-so/server";

export type Env = ApiEnv & {
  // Based on import("@hono/node-server").HttpBindings
  Bindings: {
    incoming: express.Request;
    outgoing: express.Response;
  };
};

export const createHonoRequestListener = (config: MainframeAPIOptions<Env>) => {
  const hono = createMainframeAPI<Env>(config);

  return getRequestListener(hono.fetch, {
    hostname: new URL(env.VITE_API_URL).hostname,
  });
};
