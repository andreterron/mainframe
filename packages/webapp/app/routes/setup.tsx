import { useNavigate, useSearchParams } from "@remix-run/react";
import { useEffect, useState } from "react";
import { apiBaseUrl } from "../lib/url";

export default function AuthSignup() {
    const [searchParams] = useSearchParams();
    const naivgate = useNavigate();

    const tokenInit = searchParams.get("token");

    const [autoSetupFailed, setAutoSetupFailed] = useState(false);

    async function setup(token: string) {
        // TODO: Avoid dynamic import
        const { customAlphabet } = await import("nanoid");

        const nanoid = customAlphabet(
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
        );

        const username = nanoid(16);
        const password = nanoid(32);

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
            setAutoSetupFailed(true);
            console.error(
                `Request failed with code ${res.status}\n\n`,
                await res.text(),
            );
            return;
        }

        localStorage.setItem("mainframe.username", username);
        localStorage.setItem("mainframe.password", password);

        // Redirect on success
        naivgate("/");
    }

    useEffect(() => {
        if (tokenInit) {
            setup(tokenInit).catch((e) => {
                console.error(e);
                setAutoSetupFailed(true);
            });
        }
    }, []);

    if (tokenInit && !autoSetupFailed) {
        // Return null if the autoSetup is working
        return null;
    }

    return (
        <section className="flex justify-center items-center h-screen bg-gray-100">
            <form
                className="block max-w-md w-full bg-white rounded p-6 space-y-4 shadow"
                onSubmit={async (e) => {
                    try {
                        e.preventDefault();
                        const token = (e.target as HTMLFormElement).token.value;

                        await setup(token);
                    } catch (e) {
                        console.error(e);
                    }
                }}
            >
                <div className="mb-4">
                    <p className="text-gray-600 font-bold">Unlock access</p>
                    <h2 className="text-sm">
                        Get your token after running the Mainframe terminal
                        command
                    </h2>
                </div>
                {/* <div>
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
                        htmlFor="username"
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
                </div> */}
                <div>
                    <label
                        htmlFor="username"
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
                    />
                </div>
                <div>
                    <button className="w-full py-4 bg-blue-600 hover:bg-blue-700 rounded text-sm font-bold text-gray-50 transition duration-200">
                        Sign In
                    </button>
                </div>
            </form>
        </section>
    );
}
