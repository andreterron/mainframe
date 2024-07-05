import { Operation } from "@mainframe-so/shared";
import { EventEmitter } from "node:events";
import { type EventMap } from "typed-emitter";

// workaround from https://github.com/andywer/typed-emitter/issues/39#issuecomment-1444130897
type TypedEmitter<Events extends EventMap> =
  import("typed-emitter").default<Events>;

export type OperationsEmitter = TypedEmitter<{
  operation: (operation: Operation) => void;
}>;

export async function writeOperation(
  emitter: OperationsEmitter | undefined,
  op: Operation,
) {
  emitter?.emit("operation", op);
}
