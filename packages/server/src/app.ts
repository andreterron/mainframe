import express from "express";
const app = express();

app.get("/", (req, res) => res.send("It works!"));

if (import.meta.env.PROD) app.listen(process.env.PORT || 8777);

export const viteNodeApp = app;
