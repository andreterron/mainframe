var dotenv = require("dotenv");

dotenv.config({ path: "../../.env" });

// load PouchDB with the optional node-websql adapter
var PouchDB = require("pouchdb");

// set up our databases - make sure the URL is correct!
var inputDB = new PouchDB("http://localhost:5984/mainframe", {
    auth: {
        username: process.env.COUCHDB_USER,
        password: process.env.COUCHDB_PASSWORD,
    },
});
var outputDB = new PouchDB("http://localhost:5999/mainframe");
// var outputDB = new PouchDB("mainframe.db", { adapter: "websql" });

// replicate
void (async () => inputDB.replicate.to(outputDB))()
    .then(() => process.exit(0))
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });
