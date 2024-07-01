import { LibSQLDatabase } from "drizzle-orm/libsql";
import { OperationsEmitter } from "./operations";

export interface MainframeContext {
  db: LibSQLDatabase;
  operations?: OperationsEmitter;
}
