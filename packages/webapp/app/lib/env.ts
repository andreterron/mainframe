import { envsafe, str } from "envsafe";

export const env = envsafe(
    {
        COUCHDB_CLIENT_CONNECTION_STRING: str({
            default: "http://localhost:5984/mainframe",
        }),
        COUCHDB_SERVER_CONNECTION_STRING: str({
            default: "http://localhost:5984/mainframe",
        }),
        COUCHDB_USER: str({ default: "mainframe" }),
        COUCHDB_PASSWORD: str(),
    },
    {
        env: typeof window !== "undefined" ? (window as any).ENV : process.env,
    },
);
