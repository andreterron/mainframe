import { Link, useNavigate } from "@remix-run/react";
import {
    DB_PASSWORD_KEY,
    DB_USERNAME_KEY,
    checkDBCredentials,
    setupDBSync,
} from "../lib/db";

export default function AuthSignup() {
    const navigate = useNavigate();

    async function login(username: string, password: string) {
        if (!(await checkDBCredentials(username, password))) {
            alert("Invalid credentials");
            return;
        }

        localStorage.setItem(DB_USERNAME_KEY, username);
        localStorage.setItem(DB_PASSWORD_KEY, password);

        setupDBSync();

        // Redirect on success
        navigate("/");
    }

    return (
        <form
            className="space-y-4"
            onSubmit={async (e) => {
                try {
                    e.preventDefault();
                    const form = e.target as HTMLFormElement;
                    const username = form.username.value;
                    const password = form.password.value;

                    await login(username, password);
                } catch (e) {
                    console.error(e);
                }
            }}
        >
            <div className="mb-4">
                <p className="text-gray-600 font-bold">Login</p>
                <h2 className="text-sm">
                    Don't have an account yet?{" "}
                    <Link
                        className="text-sky-600 hover:text-sky-500"
                        to="/setup"
                    >
                        Setup your account
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
        </form>
    );
}
