import { Outlet } from "@remix-run/react";
import { destroySession, getSession } from "../sessions.server";
import { LoaderArgs, json } from "@remix-run/node";

export async function loader({ request }: LoaderArgs) {
    const session = await getSession(request.headers.get("Cookie"));

    if (session.get("error") === "not_found") {
        // If the session has null data, it means it wasn't found,
        // so we destroy it from the client as well
        return json(
            {},
            {
                headers: {
                    "Set-Cookie": await destroySession(session),
                },
            },
        );
    }

    return json({});
}

export default function AuthLogin() {
    return (
        <section className="flex justify-center items-center h-screen bg-gray-100">
            <div className="block max-w-md w-full bg-white rounded p-6 shadow">
                <Outlet />
            </div>
        </section>
    );
}
