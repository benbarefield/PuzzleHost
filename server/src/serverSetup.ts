import {Application, json, urlencoded, RequestHandler} from 'express';
import puzzle from "./endpoints/puzzle";
import userPuzzles from "./endpoints/userPuzzles";
import puzzleAnswer from "./endpoints/puzzleAnswer";

export default function setupServer(app : Application, authMiddleware: RequestHandler) {
  app.use(authMiddleware);
  app.use(json());
  app.use(urlencoded({extended: false}));

  app.all("/api/puzzle/:id?", puzzle);
  app.all("/api/userPuzzles", userPuzzles);
  app.all("/api/puzzleAnswer/:id?", puzzleAnswer);
}
