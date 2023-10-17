import { EventEmitter } from "node:events";
import TypedEmitter from "typed-emitter";

export type Operation =
    | { type: "row"; tableId: string; data: any }
    | {
          type: "object";
          datasetId: string;
          objectType: string;
          data: any;
      }
    | { type: "ping" };

export const operations = new EventEmitter() as TypedEmitter<{
    operation: (operation: Operation) => void;
}>;

export async function writeOperation(op: Operation) {
    operations.emit("operation", op);
}
