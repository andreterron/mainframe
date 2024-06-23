import { getRequestListener } from "@hono/node-server";
import { env } from "./lib/env.server";
import { Env as ApiEnv } from "@mainframe-so/server";
import express from "express";
import { createMainframeAPI } from "@mainframe-so/server";

type Env = ApiEnv & {
  // Based on import("@hono/node-server").HttpBindings
  Bindings: {
    incoming: express.Request;
    outgoing: express.Response;
  };
};

export const hono = createMainframeAPI<Env>({
  getRequestDB(c) {
    return c.env.incoming.db;
  },
});

export const honoRequestListener = getRequestListener(hono.fetch, {
  hostname: new URL(env.VITE_API_URL).hostname,
});
