declare module "express-pouchdb" {
    import PouchDB from "pouchdb";
    import express from "express";

    export default function (
        startPouchDB: PouchDB.Static,
        opts?: any,
    ): express.Application;
}
