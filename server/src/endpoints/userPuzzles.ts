import {Request, Response} from "express";
import {DB_CLIENT} from "../data/sessionStarter";
import {getPuzzlesForUser} from "../data/puzzleData";

export default async function(req: Request, res: Response) : Promise<void> {
  if(req.method !== "GET") {
    res.status(501).send();
    return;
  }

  const dataAccess = req.app.get(DB_CLIENT);
  const userId = req.authenticatedUser;

  const puzzles = await getPuzzlesForUser(dataAccess, userId);

  res.send(JSON.stringify(puzzles.map(p => ({
    id: p.id,
    name: p.name,
  }))));
}
