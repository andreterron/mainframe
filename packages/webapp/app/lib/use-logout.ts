import { useNavigate } from "react-router-dom";
import { trpc } from "./trpc_client";

export function useLogout() {
  const navigate = useNavigate();
  return trpc.logout.useMutation({
    onSuccess(data, variables, context) {
      if (data.redirect.match(/^https?:\/\//)) {
        window.location.href = data.redirect;
      } else {
        navigate(data.redirect);
      }
    },
    onError(error, variables, context) {
      console.error(error);
      navigate("/");
    },
  });
}
