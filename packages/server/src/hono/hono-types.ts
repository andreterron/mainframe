import type express from "express";
import { LibSQLDatabase } from "drizzle-orm/libsql";

// Based on import("@hono/node-server").HttpBindings
type Bindings = {
  incoming: express.Request;
  outgoing: express.Response;
};

export type Env = {
  Bindings: Bindings;
  Variables: {
    db: LibSQLDatabase;
  };
};
