export async function initiateAuth(
  provider: "github",
  config?: { rootUrl?: string },
) {
  // TODO: Need to inform the developer's app ID to Mainframe
  const w = window.open(
    `${config?.rootUrl ?? "https://mainframe.so"}/connect/${provider}`,
    "_blank",
  );

  await new Promise<void>((resolve) => {
    function recheck() {
      // TODO: Only remove listeners and remove if the check was successful.
      // w?.removeEventListener("message", messageCallback);
      // TODO: Check for window.closed probably isn't a good indicator
      if (w?.closed) {
        window.removeEventListener("focus", recheck);
        resolve();
      }
    }
    // w?.addEventListener("message", (event) => {
    //   // TODO: Try to use window events to get the id of the connection so we can await the auth flow.
    //   // TODO: Only accept messages from the expected event.origin
    // });
    window.addEventListener("focus", recheck);
    // TODO: Timeout. reject
  });
}
