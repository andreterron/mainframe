import { Link, useNavigate } from "react-router-dom";
import { trpc } from "../lib/trpc_client";
import { TRPCClientError } from "@trpc/client";
import { useState } from "react";

export default function AuthSignup() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>();

    const { data: authInfo } = trpc.authInfo.useQuery();
    const hasUsers = authInfo?.hasUsers ?? false;
    const isLoggedIn = authInfo?.isLoggedIn ?? false;

    const signup = trpc.signup.useMutation();

    const navigate = useNavigate();
    async function handleSubmit(username: string, password: string) {
        setLoading(true);
        try {
            const result = await signup.mutateAsync({
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
                    <button
                        disabled={loading}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 disabled:text-gray-300 rounded text-sm font-bold text-gray-50 transition duration-200"
                    >
                        Sign up
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
            ) : hasUsers ? (
                /* Only suggest login if the DB has users */
                <div className="mt-2 text-sm text-gray-400">
                    Mainframe is already setup, please{" "}
                    <Link
                        className="text-sky-600 hover:text-sky-500"
                        to="/login"
                    >
                        Login
                    </Link>
                </div>
            ) : null}
        </div>
    );
}
