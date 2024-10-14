import 'dotenv/config';
import express from "express";
import sessionStarter from "./data/sessionStarter";
import setupServer from "./serverSetup";
import authorization from "./authorization";

const port = 8888;
const app = express();

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
    let dbClient = await sessionStarter(app);
  }
  catch(e) {
    console.log("error connecting to database:", e);
    return;
  }

  app.listen(port, () => {
    console.log(`Server started on port: ${port}
ctrl+c to quit
`);
  });
})();
