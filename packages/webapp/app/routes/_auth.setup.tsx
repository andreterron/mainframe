import { Link } from "@remix-run/react";
import { ActionArgs, json, redirect } from "@remix-run/node";
import { z } from "zod";
import { createUserAccount } from "../lib/auth.server";
import { commitSession, getSession } from "../sessions.server";

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
        return json({ error: "Invalid username/password" }, { status: 400 });
    }

    const { username, password } = parsed.data;

    // TODO: This can fail if the username already exists
    const account = await createUserAccount(username, password);

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
    return (
        <form className="space-y-4" method="post">
            <div className="mb-4">
                <h2 className="text-gray-600 font-bold">Create account</h2>
                <p className="text-sm">
                    Create a local account to secure access to your database
                </p>
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
                <button className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 disabled:text-gray-300 rounded text-sm font-bold text-gray-50 transition duration-200">
                    Sign up
                </button>
            </div>
            <div className="mt-2 text-sm text-gray-400">
                Already have an account?{" "}
                <Link className="text-sky-600 hover:text-sky-500" to="/login">
                    Login
                </Link>
            </div>
        </form>
    );
}
