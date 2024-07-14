import { EventEmitter } from "node:events";
import { OperationsEmitter } from "@mainframe-api/server";

export const GLOBAL_operations = new EventEmitter() as OperationsEmitter;
