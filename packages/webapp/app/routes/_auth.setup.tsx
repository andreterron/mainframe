import { Link, useNavigate, useSearchParams } from "@remix-run/react";
import { apiBaseUrl } from "../lib/url";
import {
    DB_PASSWORD_KEY,
    DB_USERNAME_KEY,
    checkDBCredentials,
    setupDBSync,
} from "../lib/db";
import { useEffect, useState } from "react";

export default function AuthSignup() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const tokenInit = searchParams.get("token");

    async function setup(token: string, username: string, password: string) {
        const res = await fetch(`${apiBaseUrl}/auth/create`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                username,
                password,
                token,
            }),
        });

        if (!res.ok) {
            console.error(
                `Request failed with code ${res.status}\n\n`,
                await res.text(),
            );
            return;
        }

        localStorage.setItem(DB_USERNAME_KEY, username);
        localStorage.setItem(DB_PASSWORD_KEY, password);

        setupDBSync();

        // Redirect on success
        navigate("/");
    }

    const [alreadyLoggedIn, setAlreadyLoggedIn] = useState(false);

    useEffect(() => {
        const username = localStorage.getItem(DB_USERNAME_KEY);
        const password = localStorage.getItem(DB_PASSWORD_KEY);
        if (username && password) {
            checkDBCredentials(username, password).then((loggedIn) => {
                if (loggedIn) {
                    setAlreadyLoggedIn(true);
                }
            });
        }
    }, []);

    return (
        <form
            className="space-y-4"
            onSubmit={async (e) => {
                try {
                    e.preventDefault();
                    const form = e.target as HTMLFormElement;
                    const token = form.token.value;
                    const username = form.username.value;
                    const password = form.password.value;

                    await setup(token, username, password);
                } catch (e) {
                    console.error(e);
                }
            }}
        >
            <div className="mb-4">
                <p className="text-gray-600 font-bold">Setup account</p>
                <h2 className="text-sm">
                    Get your token after running the Mainframe terminal command.
                    <br />
                    Already has an account?{" "}
                    <Link
                        className="text-sky-600 hover:text-sky-500"
                        to="/login"
                    >
                        Login
                    </Link>
                </h2>
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
                    disabled={alreadyLoggedIn}
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
                    disabled={alreadyLoggedIn}
                />
            </div>
            <div>
                <label
                    htmlFor="token"
                    className="block text-xs font-semibold text-gray-600 uppercase mb-1"
                >
                    Token
                </label>
                <input
                    className="w-full p-4 text-sm bg-gray-50 focus:outline-none border border-gray-200 rounded text-gray-600 focus:border-gray-400"
                    id="token"
                    type="password"
                    name="token"
                    autoComplete="one-time-code"
                    defaultValue={tokenInit ?? ""}
                    required
                    disabled={alreadyLoggedIn}
                />
            </div>
            <div>
                <button
                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 disabled:text-gray-300 rounded text-sm font-bold text-gray-50 transition duration-200"
                    disabled={alreadyLoggedIn}
                >
                    Sign up
                </button>
            </div>
            {alreadyLoggedIn && (
                <div className="flex flex-col items-center">
                    Already logged in!
                    <Link className="text-sky-600 hover:text-sky-500" to="/">
                        Open dashboard
                    </Link>
                    <span className="text-gray-400">or</span>
                    <Link
                        className="text-sky-600 hover:text-sky-500"
                        to="/login"
                    >
                        Update username/password
                    </Link>
                </div>
            )}
        </form>
    );
}