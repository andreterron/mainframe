import { Operation } from "@mainframe-so/shared";
import { EventEmitter } from "node:events";

export const operations = new EventEmitter();

export async function writeOperation(op: Operation) {
  operations.emit("operation", op);
}
