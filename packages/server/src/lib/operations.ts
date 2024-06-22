import { Operation } from "@mainframe-so/shared";
import { EventEmitter } from "node:events";
import type TypedEmitter from "typed-emitter";

export const operations = new EventEmitter() as TypedEmitter<{
  operation: (operation: Operation) => void;
}>;

export async function writeOperation(op: Operation) {
  operations.emit("operation", op);
}
