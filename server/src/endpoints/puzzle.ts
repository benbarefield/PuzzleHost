import {Request, Response} from 'express';
import {DB_CLIENT} from "../data/sessionStarter";
import {createPuzzle, getPuzzleById, markPuzzleAsDeleted, verifyPuzzleOwnership} from "../data/puzzleData";

async function postPuzzle(req: Request, res: Response): Promise<void> {
  const dataAccess = req.app.get(DB_CLIENT);
  const puzzleName = req.body.name;
  const currentUser = req.authenticatedUser;
  const createdId = await createPuzzle(dataAccess, puzzleName, currentUser);

  res.status(201).send(createdId);
}

async function getPuzzle(req: Request, res: Response): Promise<void> {
  const dataAccess = req.app.get(DB_CLIENT);
  const puzzleId = Number(req.params.id);
  const currentUser = req.authenticatedUser;

  if(!currentUser) {
    res.status(401).send();
    return;
  }

  if(isNaN(puzzleId)) {
    res.status(400).send("Invalid puzzle id");
    return;
  }

  const puzzleData = await getPuzzleById(dataAccess, puzzleId);
  if(!puzzleData) {
    res.status(404).send();
    return;
  }

  if(puzzleData.owner !== currentUser) {
    res.status(403).send();
    return;
  }

  res.send(JSON.stringify({name : puzzleData.name, id: puzzleId}));
}

async function deletePuzzle(req: Request, res: Response): Promise<void> {
  const dataAccess = req.app.get(DB_CLIENT);
  const puzzleId = Number(req.params.id);
  const currentUser = req.authenticatedUser;

  if(!currentUser) {
    res.status(401).send();
    return;
  }

  if(isNaN(puzzleId)) {
    res.status(400).send("Invalid puzzle id");
    return;
  }

  const allowed = await verifyPuzzleOwnership(dataAccess, puzzleId, currentUser);
  if(!allowed) {
    res.status(403).send();
    return;
  }

  await markPuzzleAsDeleted(dataAccess, puzzleId);

  res.status(204).send();
}

export default async function(req: Request, res: Response) : Promise<void> {
  if(req.method === "OPTIONS") {
    res.status(204).send();
    return;
  }
  if(req.method === 'POST') {
    return postPuzzle(req, res);
  }
  if(req.method === 'GET') {
    return getPuzzle(req, res);
  }
  if(req.method === "DELETE") {
    return deletePuzzle(req, res);
  }
  res.status(501).send();
}
