import { ActionArgs, json, redirect } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { z } from "zod";
import { validateUserAccount } from "../lib/auth.server";
import { getSession, commitSession } from "../sessions.server";

const zForm = z.object({
    username: z.string().nonempty(),
    password: z.string().nonempty(),
});

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

    const session = await getSession(request.headers.get("Cookie"));

    session.set("userId", account.id);

    return redirect("/", {
        headers: {
            "Set-Cookie": await commitSession(session),
        },
    });
}

export default function AuthSignup() {
    return (
        <form className="space-y-4" method="post">
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
                    autoComplete="new-password"
                    required
                />
            </div>
            <div>
                <button className="w-full py-4 bg-blue-600 hover:bg-blue-700 rounded text-sm font-bold text-gray-50 transition duration-200">
                    Sign In
                </button>
            </div>
            <div className="mt-2 text-sm text-gray-400">
                Don't have an account yet?{" "}
                <Link className="text-sky-600 hover:text-sky-500" to="/setup">
                    Setup your account
                </Link>
            </div>
        </form>
    );
}
