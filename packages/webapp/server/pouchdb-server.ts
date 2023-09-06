import cron from "node-cron";
import closeWithGrace from "close-with-grace";
import {
    getDatasetObject,
    getDatasetTable,
    getIntegrationForDataset,
} from "../app/lib/integrations";
import { Dataset } from "../app/lib/types";
import express from "express";
import { json, text } from "body-parser";
import { env } from "../app/lib/env";
import { ZodError, z } from "zod";
import { nanoid } from "nanoid";
import cors from "cors";
import type { Server } from "http";
import { ADMIN_ROLE, ensureAdminRole } from "./admin-role";
import { syncDataset, syncAll, syncObject, syncTable } from "./sync";
import { dbBaseUrl } from "../app/lib/url";
import { PouchDB } from "../app/lib/db.api";
import expressPouchDB from "express-pouchdb";

export function startPouchDBServer(port: number = 5984) {
    return new Promise<{ app: express.Application; server: Server }>(
        (resolve) => {
            var app = express();
            // TODO: Review cors settings (especially origin)
            app.use(
                cors({ origin: "http://localhost:8744", credentials: true }),
            );
            const pouchDBApp = expressPouchDB(PouchDB);
            // // @ts-ignore
            // pouchDBApp.setPouchDB(PouchDB);
            app.use(pouchDBApp);

            const server = app.listen(port, () => {
                resolve({ app, server });
            });
        },
    );
}
