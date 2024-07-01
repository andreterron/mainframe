import { type LibSQLDatabase } from "drizzle-orm/libsql";
import { type OperationsEmitter } from "./lib/operations";

export type Env = {
  Variables: {
    db?: LibSQLDatabase;
    operations?: OperationsEmitter;
  };
};
