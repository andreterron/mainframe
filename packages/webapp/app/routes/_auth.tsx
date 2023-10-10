import { Outlet } from "@remix-run/react";

export default function AuthLogin() {
    return (
        <section className="flex justify-center items-center h-screen bg-gray-100">
            <div className="block max-w-md w-full bg-white rounded p-6 shadow">
                <Outlet />
            </div>
        </section>
    );
}
