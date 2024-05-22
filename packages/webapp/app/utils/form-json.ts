// NOTE: Only works with strings. Will fail if the form has multiple values for the same key.
export function formJson(form: HTMLFormElement) {
  return Object.fromEntries(
    Array.from(new FormData(form).entries()).filter(
      (args): args is [string, string] => typeof args[1] === "string",
    ),
  );
}
