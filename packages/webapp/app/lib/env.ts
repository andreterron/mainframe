import { envsafe, num, str } from "envsafe";
import dotenv from "dotenv";

if (typeof window === "undefined") {
    dotenv.config({ path: "../../.env" });
} else if (!("process" in window)) {
    (window as any).process = { env: {} };
}

export const env = envsafe(
    {
        COUCHDB_SERVER_CONNECTION_STRING: str({
            default: "http://localhost:5984/mainframe",
        }),
        COUCHDB_USER: str({ default: "mainframe" }),
        // TODO: Remove default once this file is only used in the server
        COUCHDB_PASSWORD: str({ default: "", allowEmpty: true }),
        // TODO: Remove default once this file is only used in the server
        PORT: num({ default: 8744 }),
        SYNC_PORT: num({ default: 8745 }),
        TUNNEL_BASE_API_URL: str({ default: "", allowEmpty: true }),
    },
    {
        env: typeof window !== "undefined" ? (window as any).ENV : process.env,
    },
);
