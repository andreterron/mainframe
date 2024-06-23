import { Operation } from "@mainframe-so/shared";
import { EventEmitter } from "node:events";
import { type EventMap } from "typed-emitter";

// workaround from https://github.com/andywer/typed-emitter/issues/39#issuecomment-1444130897
type TypedEmitter<Events extends EventMap> = import("typed-emitter").default<
  Events
>;

export const operations = new EventEmitter() as TypedEmitter<{
  operation: (operation: Operation) => void;
}>;

export async function writeOperation(op: Operation) {
  operations.emit("operation", op);
}
