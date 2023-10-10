import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { trpc } from "../lib/trpc_client";
import { TRPCClientError } from "@trpc/client";

export default function AuthLogin() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>();
    const { data: authInfo } = trpc.authInfo.useQuery();
    const hasUsers = authInfo?.hasUsers ?? false;
    const isLoggedIn = authInfo?.isLoggedIn ?? false;

    const navigate = useNavigate();

    const login = trpc.login.useMutation();

    async function handleSubmit(username: string, password: string) {
        setLoading(true);
        try {
            const result = await login.mutateAsync({
                username,
                password,
            });
            navigate(result.redirect);
        } catch (e) {
            console.error(e);
            if (e instanceof TRPCClientError) {
                setError(e.message);
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-4">
            <form
                className="space-y-4"
                onSubmit={(e) => {
                    e.preventDefault();
                    if (e.target instanceof HTMLFormElement) {
                        handleSubmit(
                            e.target.username.value,
                            e.target.password.value,
                        );
                    }
                }}
            >
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
                    <button
                        disabled={loading}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-700 rounded text-sm font-bold text-gray-50 transition duration-200"
                    >
                        Sign In
                    </button>
                </div>
                {error ? (
                    <div className="mt-2 text-sm text-rose-700">{error}</div>
                ) : null}
            </form>
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
