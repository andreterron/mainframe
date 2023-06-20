import PouchDB from "pouchdb";
import { env } from "./env";
import { DBTypes } from "./types";

export const db =
    typeof window !== "undefined"
        ? new PouchDB<DBTypes>("mainframe")
        : new PouchDB<DBTypes>(env.COUCHDB_SERVER_CONNECTION_STRING, {
              auth: {
                  username: env.COUCHDB_USER,
                  password: env.COUCHDB_PASSWORD,
              },
          });

if (typeof window !== "undefined") {
    db.sync(
        new PouchDB<DBTypes>(env.COUCHDB_CLIENT_CONNECTION_STRING, {
            auth: {
                username: env.COUCHDB_USER,
                password: env.COUCHDB_PASSWORD,
            },
        }),
        {
            live: true,
            retry: true,
        },
    );
}
