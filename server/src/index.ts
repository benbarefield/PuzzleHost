import 'dotenv/config';
import express from "express";
import puzzle from './endpoints/puzzle';
import userPuzzles from "./endpoints/userPuzzles";
import sessionStarter from "./data/sessionStarter";

const port = 8888;
const app = express();

(async function() {
  app.use(express.json());
  app.use(express.urlencoded({extended: false}));
  // app.use(authenticator);

  try {
    await sessionStarter(app);
  }
  catch(e) {
    console.log("error connecting to database:", e);
    return;
  }

  app.all("puzzle/:id?", puzzle);
  app.all("userPuzzles", userPuzzles);

  app.listen(port, () => {
    console.log(`Server started on port: ${port}
ctrl+c to quit
`);
  });
})();
