export const baseUrl =
    typeof window !== "undefined"
        ? `${window.location.protocol}//${window.location.hostname}`
        : "http://localhost";

// TODO: Ensure the port comes from the env
export const apiBaseUrl = `${baseUrl}:8745`;
