import { Operation } from "@mainframe-so/shared";
import { EventEmitter } from "node:events";
import TypedEventEmitter, { EventMap } from "typed-emitter";

// workaround from https://github.com/andywer/typed-emitter/issues/39#issuecomment-1607364367
type TypedEmitter<T extends EventMap> = TypedEventEmitter.default<T>;

export const operations = new EventEmitter() as TypedEmitter<{
  operation: (operation: Operation) => void;
}>;

export async function writeOperation(op: Operation) {
  operations.emit("operation", op);
}
