import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "../../server/trpc_router";

export const trpc = createTRPCReact<AppRouter>();
