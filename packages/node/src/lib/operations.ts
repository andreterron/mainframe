import { EventEmitter } from "node:events";
import { OperationsEmitter } from "@mainframe-so/server";

export const GLOBAL_operations = new EventEmitter() as OperationsEmitter;
