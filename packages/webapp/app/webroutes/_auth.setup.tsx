import { Link, useNavigate } from "react-router-dom";
import { trpc } from "../lib/trpc_client";
import { TRPCClientError } from "@trpc/client";
import { useState } from "react";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useLogout } from "../lib/use-logout";

export default function AuthSignup() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const { data: authInfo } = trpc.authInfo.useQuery();
  const { data: authEnabled, isLoading: loadingAuthEnabled } =
    trpc.authEnabled.useQuery();
  const hasUsers = authInfo?.hasUsers ?? false;
  const isLoggedIn = authInfo?.isLoggedIn ?? false;

  const signup = trpc.signup.useMutation();
  const logout = useLogout();

  const navigate = useNavigate();
  async function handleSubmit(username: string, password: string) {
    setLoading(true);
    try {
      const result = await signup.mutateAsync({
        username,
        password,
      });
      navigate(result.redirect);
    } catch (e) {
      console.error(e);
      if (e instanceof TRPCClientError) {
        setError(e.message);
      }
    } finally {
      setLoading(false);
    }
  }

  if (loadingAuthEnabled) {
    return null;
  }

  return (
    <div className={cn("grid gap-6")}>
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Create an account
        </h1>
        <p className="text-sm text-muted-foreground">
          This protects access to your database
        </p>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (e.target instanceof HTMLFormElement) {
            handleSubmit(e.target.username.value, e.target.password.value);
          }
        }}
      >
        <div className="grid gap-2">
          {authEnabled?.pass.enabled ? (
            <>
              <div className="grid gap-1">
                <Label htmlFor="email">Username</Label>
                <Input
                  id="username"
                  type="text"
                  autoCapitalize="none"
                  autoComplete="username"
                  autoCorrect="off"
                  placeholder="memex"
                  disabled={loading}
                />
              </div>
              <div className="grid gap-1">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  name="password"
                  placeholder="•••••••••••••"
                  autoComplete="new-password"
                  required
                  disabled={loading}
                />
              </div>
              <Button disabled={loading}>
                {/* {loading && (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            )} */}
                Sign up
              </Button>
            </>
          ) : null}
          {authEnabled?.link.enabled ? (
            <Button asChild>
              <a href={authEnabled.link.loginUrl}>Login with Hello</a>
            </Button>
          ) : null}
          <div className="mt-2 text-sm text-rose-700">
            {error ?? <>&nbsp;</>}
          </div>
          {isLoggedIn ? (
            <div className="mt-2 text-sm grid gap-1 text-center">
              <span className="font-semibold">You're already logged in!</span>
              <div>
                <Link
                  className="underline text-gray-500 hover:text-neutral-900"
                  to="/"
                >
                  Go to dashboard
                </Link>{" "}
                <span className="text-gray-500">•</span>{" "}
                <button
                  className="underline text-gray-500 hover:text-neutral-900"
                  onClick={() => logout.mutate()}
                >
                  Logout
                </button>
              </div>
            </div>
          ) : hasUsers ? (
            /* Only suggest login if the DB has users */
            <div className="mt-2 text-sm text-gray-500 text-center">
              Mainframe is already setup, please{" "}
              <Link className="underline hover:text-neutral-900" to="/login">
                Login
              </Link>
            </div>
          ) : (
            <div className="mt-2 text-sm text-gray-400">&nbsp;</div>
          )}
        </div>
      </form>
      {/* <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>
      <Button variant="outline" type="button" disabled={loading}>
        {loading ? (
          <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Icons.gitHub className="mr-2 h-4 w-4" />
        )}{" "}
        GitHub
      </Button> */}
      {/* TODO: Terms of Service and Privacy Policy */}
      {/* <p className="px-8 text-center text-sm text-muted-foreground">
        By clicking continue, you agree to our{" "}
        <Link
          href="/terms"
          className="underline underline-offset-4 hover:text-primary"
        >
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link
          href="/privacy"
          className="underline underline-offset-4 hover:text-primary"
        >
          Privacy Policy
        </Link>
        .
      </p> */}
    </div>
  );
}
