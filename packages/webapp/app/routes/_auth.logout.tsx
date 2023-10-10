import { useEffect } from "react";
import { trpc } from "../lib/trpc_client";
import { useNavigate } from "@remix-run/react";

export default function AuthLogout() {
    const logout = trpc.logout.useMutation();
    const navigate = useNavigate();

    async function handleLogout() {
        try {
            const result = await logout.mutateAsync();
            navigate(result.redirect);
        } catch (e) {
            console.error(e);
            navigate("/");
        }
    }

    useEffect(() => {
        handleLogout();
    }, []);
    return null;
}
