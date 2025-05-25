import 'dotenv/config';
import express from "express";
import websocketExpress from 'express-ws';
import sessionStarter from "./data/sessionStarter";
import setupServer from "./serverSetup";
import authorization from "./authorization";
import EventEmitter from "node:events";
import puzzleListener from "./endpoints/puzzleListener";

const port = 8888;
const app = websocketExpress(express()).app;

export const EVENT_EMITTER = "eventing";

(async function() {
  // todo: fix up cors.
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", ["*"]);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept");
    next();
  });
  setupServer(app, authorization);

  try {
    await sessionStarter(app);
  }
  catch(e) {
    console.log("error connecting to database:", e);
    return;
  }

  const eventing = new EventEmitter();
  app.set(EVENT_EMITTER, eventing);

  app.ws("/puzzle/:id", puzzleListener(eventing));

  app.listen(port, () => {
    console.log(`Server started on port: ${port}
ctrl+c to quit
`);
  });
})();
