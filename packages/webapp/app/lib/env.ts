import { envsafe, str } from "envsafe";
import dotenv from "dotenv";

if (typeof window === "undefined") {
    dotenv.config({ path: "../../.env" });
}

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
