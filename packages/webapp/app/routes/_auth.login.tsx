import { ActionArgs, LoaderArgs, json, redirect } from "@remix-run/node";
import { Link, useFetcher, useLoaderData } from "@remix-run/react";
import { z } from "zod";
import { validateUserAccount } from "../lib/auth.server";
import { getSession, commitSession } from "../sessions.server";
import { checkIfUserExists } from "../db/helpers";

const zForm = z.object({
    username: z.string().nonempty(),
    password: z.string().nonempty(),
});

export async function loader({ request }: LoaderArgs) {
    const hasUsers = await checkIfUserExists();

    const session = await getSession(request.headers.get("Cookie"));
    const userId = session.get("userId");

    return json({
        hasUsers,
        isLoggedIn: !!userId,
    });
}

export async function action({ request }: ActionArgs) {
    const data = await request.formData();

    const parsed = zForm.safeParse({
        username: data.get("username"),
        password: data.get("password"),
    });

    if (!parsed.success) {
        return json({ error: "Missing username/password" }, { status: 400 });
    }

    const { username, password } = parsed.data;

    const account = await validateUserAccount(username, password);

    if (!account) {
        return json({ error: "Invalid username/password" }, { status: 401 });
    }

    // Don't pass the cookie header here, because we always want a fresh session
    const session = await getSession();

    session.set("userId", account.id);

    return redirect("/", {
        headers: {
            "Set-Cookie": await commitSession(session),
        },
    });
}

export default function AuthSignup() {
    const fetcher = useFetcher<typeof action>();
    const { hasUsers, isLoggedIn } = useLoaderData<typeof loader>();

    const error = fetcher.data?.error;

    return (
        <div className="space-y-4">
            <fetcher.Form className="space-y-4" method="post">
                <div className="mb-4">
                    <h2 className="text-gray-600 font-bold">Login</h2>
                </div>
                <div>
                    <label
                        htmlFor="username"
                        className="block text-xs font-semibold text-gray-600 uppercase mb-1"
                    >
                        Username
                    </label>
                    <input
                        className="w-full p-4 text-sm bg-gray-50 focus:outline-none border border-gray-200 rounded text-gray-600 focus:border-gray-400"
                        id="username"
                        name="username"
                        autoComplete="username"
                        type="text"
                    />
                </div>
                <div>
                    <label
                        htmlFor="password"
                        className="block text-xs font-semibold text-gray-600 uppercase mb-1"
                    >
                        Password
                    </label>
                    <input
                        className="w-full p-4 text-sm bg-gray-50 focus:outline-none border border-gray-200 rounded text-gray-600 focus:border-gray-400"
                        id="password"
                        type="password"
                        name="password"
                        autoComplete="current-password"
                        required
                    />
                </div>
                <div>
                    <button className="w-full py-4 bg-blue-600 hover:bg-blue-700 rounded text-sm font-bold text-gray-50 transition duration-200">
                        Sign In
                    </button>
                </div>
                {error ? (
                    <div className="mt-2 text-sm text-rose-700">{error}</div>
                ) : null}
            </fetcher.Form>
            {isLoggedIn ? (
                <div className="mt-2 text-sm">
                    <span className="font-semibold">
                        You're already logged in!
                    </span>{" "}
                    <Link className="text-sky-600 hover:text-sky-500" to="/">
                        Go to dashboard
                    </Link>{" "}
                    <span className="text-gray-400">•</span>{" "}
                    <Link
                        className="text-sky-600 hover:text-sky-500"
                        to="/logout"
                    >
                        Logout
                    </Link>
                </div>
            ) : !hasUsers ? (
                /* Only suggest signup if the DB has no users */
                <div className="mt-2 text-sm text-gray-400">
                    Don't have an account yet?{" "}
                    <Link
                        className="text-sky-600 hover:text-sky-500"
                        to="/setup"
                    >
                        Setup your account
                    </Link>
                </div>
            ) : null}
        </div>
    );
}
