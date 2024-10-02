import {Application, json, urlencoded, RequestHandler} from 'express';
import puzzle from "./endpoints/puzzle";
import userPuzzles from "./endpoints/userPuzzles";

export default function setupServer(app : Application, authMiddleware: RequestHandler) {
  app.use(authMiddleware);
  app.use(json());
  app.use(urlencoded({extended: false}));

  app.all("/puzzle/:id?", puzzle);
  app.all("/userPuzzles", userPuzzles);
}
