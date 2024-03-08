import { useEffect } from "react";
import { useLogout } from "../lib/use-logout";

export default function AuthLogout() {
  const logout = useLogout();

  useEffect(() => {
    logout.mutate();
  }, []);
  return null;
}
