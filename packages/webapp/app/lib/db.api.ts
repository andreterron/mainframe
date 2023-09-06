import PouchDB from "pouchdb";
import PouchDBFind from "pouchdb-find";
import PouchDBWebSQLAdapter from "pouchdb-adapter-node-websql";
import { DBTypes } from "./types";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const prefix = `${resolve(__dirname, "..", "..", "..", "..", "db")}/`;

PouchDB.defaults({
    prefix,
    adapter: "websql",
});

PouchDB.plugin(PouchDBFind);

PouchDB.plugin(PouchDBWebSQLAdapter);

export { PouchDB };

export const db = new PouchDB<DBTypes>("mainframe.db", {
    name: "mainframe",
    adapter: "websql",
    prefix,
});
