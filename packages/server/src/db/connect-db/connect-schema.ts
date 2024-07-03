import { sqliteTable, text, customType } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

const enumType = <VALUES extends readonly string[]>(
  name: string,
  values: VALUES,
) =>
  customType<{
    data: VALUES[number];
    driverData: string;
  }>({
    dataType() {
      return `text check(\`${name}\` IN (${values
        .map((v) => `'${v}'`)
        .join(",")}))`;
    },
  })(name);

// TODO: Type validation and Error handling
const json = <TData>(name: string) =>
  customType<{ data: TData; driverData: string | null }>({
    dataType() {
      return "text";
    },
    toDriver(value: TData): string | null {
      if (value === null || value === undefined) {
        return null;
      }
      return JSON.stringify(value);
    },
    fromDriver(value) {
      if (value === null) {
        return null;
      }
      return JSON.parse(value);
    },
  })(name);

export const appsTable = sqliteTable("apps", {
  id: text("id")
    .default(sql`(lower(hex(randomblob(16))))`)
    .notNull()
    .primaryKey(),
  name: text("name").default("").notNull(),
  ownerId: text("owner_id").notNull(),
});

export const sessionsTable = sqliteTable("sessions", {
  id: text("id").notNull().primaryKey(),
  userId: text("user_id"),
  // .references(() => usersTable.id, {
  //   onDelete: "cascade",
  //   onUpdate: "cascade",
  // }),
  appId: text("app_id").references(() => appsTable.id, {
    onDelete: "cascade",
    onUpdate: "cascade",
  }),
  // expires: integer("expires"),
});

export const connectionsTable = sqliteTable("connections", {
  id: text("id").notNull().primaryKey(),
  sessionId: text("session_id").references(() => sessionsTable.id, {
    onDelete: "cascade",
    onUpdate: "cascade",
  }),
  nangoConnectionId: text("nango_connection_id"),
  provider: enumType("provider", ["github"] as const),
});
