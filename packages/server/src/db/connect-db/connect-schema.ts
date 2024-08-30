import {
  sqliteTable,
  text,
  customType,
  integer,
  index,
} from "drizzle-orm/sqlite-core";
import { relations, sql } from "drizzle-orm";
import { supportedConnectProviders } from "../../lib/integrations";

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

const runtimeEnumType = <VALUES extends readonly string[]>(
  name: string,
  values: VALUES,
) =>
  customType<{
    data: VALUES[number];
    driverData: string;
  }>({
    dataType() {
      return "text";
    },
    toDriver(value: VALUES[number]): string {
      if (!values.includes(value)) {
        throw new Error("Invalid enum value");
      }
      return value;
    },
    fromDriver(value) {
      if (!values.includes(value)) {
        throw new Error("Invalid enum value");
      }
      return value;
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
  showSetup: integer("show_setup", { mode: "boolean" }).notNull().default(true),
});

// export const usersTable = sqliteTable("users", {
//   id: text("id")
//     .default(sql`(lower(hex(randomblob(16))))`)
//     .notNull()
//     .primaryKey(),
//   appId: text("app_id").references(() => appsTable.id, {
//     onDelete: "cascade",
//     onUpdate: "cascade",
//   }),
// });

export const sessionsTable = sqliteTable("sessions", {
  id: text("id").notNull().primaryKey(),
  userId: text("user_id"),
  // .references(() => usersTable.id, {
  //   onDelete: "cascade",
  //   onUpdate: "cascade",
  // }),
  appId: text("app_id")
    .notNull()
    .references(() => appsTable.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
  // expires: integer("expires"),
});

export const connectionsTable = sqliteTable(
  "connections",
  {
    id: text("id").notNull().primaryKey(),
    // userId: text("user_id").references(() => usersTable.id, {
    sessionId: text("session_id")
      .notNull()
      .references(() => sessionsTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    nangoConnectionId: text("nango_connection_id"),
    provider: runtimeEnumType("provider", supportedConnectProviders).notNull(),
    initiatedAt: integer("initiated_at_sec", { mode: "timestamp" }).notNull(),
    linkId: text("link_id").unique(),
  },
  (table) => ({
    initiatedAtIndex: index("initiated_at_idx").on(table.initiatedAt),
  }),
);

export const connectionSessionRelation = relations(
  connectionsTable,
  ({ one }) => ({
    session: one(sessionsTable, {
      fields: [connectionsTable.sessionId],
      references: [sessionsTable.id],
    }),
  }),
);

export const sessionAppRelation = relations(sessionsTable, ({ one }) => ({
  app: one(appsTable, {
    fields: [sessionsTable.appId],
    references: [appsTable.id],
  }),
}));
