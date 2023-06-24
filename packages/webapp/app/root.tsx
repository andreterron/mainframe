import { json, type LinksFunction } from "@remix-run/node";
import {
    Links,
    LiveReload,
    Meta,
    Outlet,
    Scripts,
    ScrollRestoration,
    useLoaderData,
    V2_MetaFunction,
} from "@remix-run/react";

import stylesheet from "~/tailwind.css";
import { env } from "./lib/env";

export const links: LinksFunction = () => [
    { rel: "stylesheet", href: stylesheet },
];

export const meta: V2_MetaFunction = () => [{ title: "Mainframe" }];

export async function loader() {
    return json({
        ENV: {
            ...env,
        },
    });
}

export default function App() {
    const { ENV } = useLoaderData<typeof loader>();
    return (
        <html lang="en">
            <head>
                <meta charSet="utf-8" />
                <meta
                    name="viewport"
                    content="width=device-width,initial-scale=1"
                />
                <Meta />
                <Links />
            </head>
            <body>
                <Outlet />
                <ScrollRestoration />
                <script
                    dangerouslySetInnerHTML={{
                        __html: `window.ENV = ${JSON.stringify(ENV)}`,
                    }}
                />
                <Scripts />
                <LiveReload />
            </body>
        </html>
    );
}
