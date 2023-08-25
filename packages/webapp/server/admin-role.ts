import { env } from "../app/lib/env";

// This is not a generic CouchDB admin, it's just an admin of the `mainframe` database
// They won't have access to the `_users` db for example
export const ADMIN_ROLE = "mainframe_db_admin";

interface PouchDBSecurityObject {
    admins: { names: string[]; roles: string[] };
}

export async function ensureAdminRole() {
    // Ensure the DB has admin role
    try {
        const getRes = await fetch(
            `${env.COUCHDB_SERVER_CONNECTION_STRING}/_security`,
            {
                method: "GET",
                headers: {
                    Authorization:
                        "Basic " +
                        Buffer.from(
                            env.COUCHDB_USER + ":" + env.COUCHDB_PASSWORD,
                        ).toString("base64"),
                },
            },
        );
        if (!getRes.ok) {
            console.error(
                `Get DB Admin failed with status ${getRes.status}`,
                await getRes.text(),
            );
            return;
        }

        const security: PouchDBSecurityObject = await getRes.json();

        if (security.admins.roles.includes(ADMIN_ROLE)) {
            console.log("DB already has the admin role configured");
            return;
        }

        security.admins.roles.push(ADMIN_ROLE);

        const putRes = await fetch(
            `${env.COUCHDB_SERVER_CONNECTION_STRING}/_security`,
            {
                method: "PUT",
                headers: {
                    Authorization:
                        "Basic " +
                        Buffer.from(
                            env.COUCHDB_USER + ":" + env.COUCHDB_PASSWORD,
                        ).toString("base64"),
                },
                body: JSON.stringify(security),
            },
        );
        if (putRes.ok) {
            console.log("Ensured db has the admin role");
        } else {
            console.error(
                `Set Admin failed with status ${putRes.status}`,
                await putRes.text(),
            );
        }
    } catch (e) {
        console.error(e);
    }
}
