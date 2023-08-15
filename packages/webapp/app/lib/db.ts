import PouchDB from "pouchdb";
import PouchDBFind from "pouchdb-find";
import { env } from "./env";
import { DBTypes } from "./types";
import { baseUrl } from "./url";

export const DB_USERNAME_KEY = "mainframe.username";
export const DB_PASSWORD_KEY = "mainframe.password";

export const db =
    typeof window !== "undefined"
        ? new PouchDB<DBTypes>("mainframe")
        : new PouchDB<DBTypes>(env.COUCHDB_SERVER_CONNECTION_STRING, {
              auth: {
                  username: env.COUCHDB_USER,
                  password: env.COUCHDB_PASSWORD,
              },
          });

PouchDB.plugin(PouchDBFind);

let sync: undefined | PouchDB.Replication.Sync<DBTypes>;

export async function checkDBCredentials(
    username: string,
    password: string,
): Promise<boolean> {
    const connString = `${baseUrl}:5984`;
    const res = await fetch(connString, {
        headers: {
            Authorization: `Basic ${btoa(username + ":" + password)}`,
        },
    });
    return res.ok;
}

export function stopDBSync() {
    if (sync) {
        sync.cancel();
        sync = undefined;
    }
}

export function setupDBSync() {
    const username = localStorage.getItem(DB_USERNAME_KEY);
    const password = localStorage.getItem(DB_PASSWORD_KEY);
    const connString = `${baseUrl}:5984/mainframe`;
    if (username && password) {
        stopDBSync();
        sync = db.sync(
            new PouchDB<DBTypes>(connString, {
                auth: {
                    username,
                    password,
                },
            }),
            {
                live: true,
                retry: true,
            },
        );
    } else {
        console.log("Missing username and password to sync DB");
    }
}

if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
    setupDBSync();
}
