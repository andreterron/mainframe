import { sqliteTable, text, unique, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

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
    },
    (usersTable) => ({
        uniqueUsername: unique().on(usersTable.username),
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
