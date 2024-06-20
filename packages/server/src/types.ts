import { LibSQLDatabase } from "drizzle-orm/libsql";

export type Env = {
  Variables: {
    db?: LibSQLDatabase;
  };
};
