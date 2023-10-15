#! /usr/bin/env node

import { $, cd } from "zx";
import { isYarn } from "is-npm";

const REPO_URL = "https://github.com/andreterron/mainframe.git";

async function installDependencies() {
    const userAgent = process.env.npm_config_user_agent || "";

    if (isYarn) {
        return await $`yarn`;
    }

    const isPnpm = userAgent.startsWith("pnpm");
    if (isPnpm) {
        return await $`pnpm i`;
    }

    return await $`npm i`;
}

void (async function () {
    // git clone
    // TODO: pick destination folder
    await $`git clone ${REPO_URL}`;

    cd("mainframe");

    await installDependencies();

    // How to run
    console.log("\nRun this command to start your Mainframe:\n\npm start");

    // TODO: run on login https://github.com/andreterron/mainframe/issues/13
    // TODO: delete git
    // TODO: only copy the needed files instead of cloning the whole repo
})()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
