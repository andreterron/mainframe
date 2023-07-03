import "dotenv/config";
import { nanoid } from "nanoid";
import { writeFile, readFile } from "fs/promises";
import { join } from "path";
import { parse } from "dotenv"

// Function from https://www.npmjs.com/package/update-dotenv
function escapeNewlines(str) {
    return str.replace(/\n/g, '\\n')
}

// Function from https://www.npmjs.com/package/update-dotenv
function format(key, value) {
    return `${key}=${escapeNewlines(value)}\n`
}

// Function inspired by https://www.npmjs.com/package/update-dotenv
async function main() {

    // Return if the relevant variables are set
    if (process.env.COUCHDB_USER && process.env.COUCHDB_PASSWORD) {
        return;
    }

    // Generate or update .env file with user and password
    const filename = join(process.cwd(), '.env')
    try {
        // Parse current env
        let isNew = false
        let existing = {}
        try {
            existing = parse(await readFile(filename, 'utf8'));
        } catch (err) {
            if (err.code === 'ENOENT') {
                isNew = true
            } else {
                throw err
            }
        }

        // Write new env
        const env = {
            ...existing,
            COUCHDB_USER: existing.COUCHDB_USER || "mainframe",
            COUCHDB_PASSWORD: existing.COUCHDB_PASSWORD || nanoid(32),
        }
        const contents = Object.keys(env).map(key => format(key, env[key]))
        await writeFile(filename, contents, 'utf8')

        // Report success
        console.log(isNew ? `Generated new .env file` : `Updated .env file`)
        return;
    } catch (err) {
        console.error("Unexpected error");
        throw err;
    }
}

main().then(
    () => {
        process.exit(0);
    },
    (e) => {
        console.error(e);
        process.exit(1);
    },
);
