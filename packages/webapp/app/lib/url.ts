export const baseUrl =
    typeof window !== "undefined"
        ? `${window.location.protocol}//${window.location.hostname}`
        : "http://127.0.0.1";

// TODO: Ensure the port comes from the env
export const apiBaseUrl = `${baseUrl}:8745`;

export const dbBaseUrl = `${baseUrl}:5984`;
// export const dbBaseUrl = `http://127.0.0.1:5984`;
// export const dbBaseUrl = `${apiBaseUrl}/db`;
