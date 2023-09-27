import { ActionArgs, LoaderArgs, redirect } from "@remix-run/node";
import { getSession, destroySession } from "../sessions.server";
import { checkIfUserExists } from "../db/helpers";

async function logout({ request }: LoaderArgs) {
    const session = await getSession(request.headers.get("Cookie"));

    const hasUsers = await checkIfUserExists();

    return redirect(hasUsers ? "/login" : "/setup", {
        headers: {
            "Set-Cookie": await destroySession(session),
        },
    });
}

export async function loader(args: LoaderArgs) {
    return logout(args);
}

export async function action(args: ActionArgs) {
    return logout(args);
}
