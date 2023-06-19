import type { V2_MetaFunction } from "@remix-run/node";

export const meta: V2_MetaFunction = () => {
    return [
        { title: "Mainframe" },
        { name: "description", content: "Welcome to your Mainframe!" },
    ];
};

export default function Index() {
    return <>Content</>;
}
