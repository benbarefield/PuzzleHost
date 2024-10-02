import {Request, Response} from "express";
import {DB_CLIENT} from "../data/sessionStarter";
import {getPuzzlesForUser} from "../data/puzzleData";

export default async function(req: Request, res: Response) {
  const dataAccess = req.app.get(DB_CLIENT);
  const userId = req.authenticatedUser;

  const puzzles = await getPuzzlesForUser(dataAccess, userId);

  res.status(200);
  res.send(JSON.stringify(puzzles));
}
