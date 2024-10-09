import {Request, Response} from 'express';
import {DB_CLIENT} from "../data/sessionStarter";
import {createPuzzle, getPuzzleById} from "../data/puzzleData";

async function postPuzzle( req: Request, res: Response): Promise<void> {
  const dataAccess = req.app.get(DB_CLIENT);
  const puzzleName = req.body.name;
  const currentUser = req.authenticatedUser;
  const createdId = await createPuzzle(dataAccess, puzzleName, currentUser);

  res.status(201).send(createdId);
}

async function getPuzzle(req: Request, res: Response): Promise<void> {
  const dataAccess = req.app.get(DB_CLIENT);
  const puzzleId = req.params.id;

  const puzzleData = await getPuzzleById(dataAccess, +puzzleId);

  res.send(JSON.stringify({name : puzzleData.name}));
}

export default async function(req: Request, res: Response) : Promise<void> {
  if(req.method === 'POST') {
    return postPuzzle(req, res);
  }
  if(req.method === 'GET') {
    return getPuzzle(req, res);
  }
  res.status(501).send();
}
