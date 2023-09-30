import {
    sqliteTable,
    text,
    unique,
    integer,
    customType,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// TODO: This only exists to ensure there's only one active user. This type can
//       be removed once admins can create other users, and we have permissions
const singleUserKey = (name: string) =>
    customType<{
        data: "admin";
        driverData: string;
    }>({
        dataType() {
            return `text check(\`${name}\` == 'admin')`;
        },
    })(name);

export const datasetsTable = sqliteTable("datasets", {
    id: text("id")
        .default(sql`(lower(hex(randomblob(16))))`)
        .notNull()
        .primaryKey(),
    name: text("name").default("").notNull(),
    integrationType: text("integration_type"),
    token: text("token"),
});

export const tablesTable = sqliteTable(
    "tables",
    {
        id: text("id")
            .default(sql`(lower(hex(randomblob(16))))`)
            .notNull()
            .primaryKey(),
        name: text("name").default("").notNull(),
        key: text("key").notNull(),
        datasetId: text("dataset_id").references(() => datasetsTable.id, {
            onUpdate: "cascade",
            onDelete: "cascade",
        }),
        view: text("view"),
    },
    (tablesTable) => ({
        uniqueTableSourceId: unique().on(
            tablesTable.datasetId,
            tablesTable.key,
        ),
    }),
);

export const rowsTable = sqliteTable(
    "rows",
    {
        id: text("id")
            .default(sql`(lower(hex(randomblob(16))))`)
            .notNull()
            .primaryKey(),
        sourceId: text("source_id"),
        tableId: text("table_id")
            .notNull()
            .references(() => tablesTable.id, {
                onUpdate: "cascade",
                onDelete: "cascade",
            }),
        data: text("data"),
    },
    (rowsTable) => ({
        uniqueTableSourceId: unique().on(rowsTable.tableId, rowsTable.sourceId),
    }),
);

export const objectsTable = sqliteTable(
    "objects",
    {
        id: text("id")
            .default(sql`(lower(hex(randomblob(16))))`)
            .notNull()
            .primaryKey(),
        sourceId: text("source_id"),
        objectType: text("object_type").notNull(),
        datasetId: text("dataset_id")
            .notNull()
            .references(() => datasetsTable.id, {
                onUpdate: "cascade",
                onDelete: "cascade",
            }),
        data: text("data"),
    },
    (objectsTable) => ({
        uniqueTableSourceId: unique().on(
            objectsTable.objectType,
            objectsTable.datasetId,
        ),
    }),
);

export const usersTable = sqliteTable(
    "users",
    {
        id: text("id")
            .default(sql`(lower(hex(randomblob(16))))`)
            .notNull()
            .primaryKey(),
        username: text("username").notNull(),
        password: text("password").notNull(),
        singleUserKey: singleUserKey("single_user_key")
            .notNull()
            .default("admin"),
    },
    (usersTable) => ({
        uniqueUsername: unique().on(usersTable.username),
        singleUserConstraint: unique().on(usersTable.singleUserKey),
    }),
);

export const sessionsTable = sqliteTable("sessions", {
    id: text("id").notNull().primaryKey(),
    userId: text("userId").references(() => usersTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
    }),
    expires: integer("expires"),
});
