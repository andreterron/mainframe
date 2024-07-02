export async function initiateAuth(
  provider: "github",
  config?: { rootUrl?: string },
) {
  // TODO: Need to inform the developer's app ID to Mainframe
  const w = window.open(
    `${config?.rootUrl ?? "https://mainframe.so"}/connect/${provider}`,
    "_blank",
  );
  // w?.addEventListener("message", (event) => {
  //   // TODO: Try to use window events to get the id of the connection so we can await the auth flow.
  //   // TODO: Only accept messages from the expected event.origin
  // });
}
