import type { Config } from "tailwindcss";

export default {
    content: ["./app/**/*.{js,jsx,ts,tsx}"],
    darkMode: "class",
    theme: {
        extend: {
            boxShadow: {
                "0-2": "0 2px 0 0 rgba(156, 163, 175,1)",
                "0": "0 0 0 0 rgba(156, 163, 175,1)",
            },
        },
    },
    plugins: [],
} satisfies Config;
