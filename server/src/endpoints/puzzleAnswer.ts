import { Request, Response} from "express";
import {DB_CLIENT} from "../data/sessionStarter";
import {getPuzzleById} from "../data/puzzleData";
import {createPuzzleAnswer, getPuzzleAnswerById} from "../data/puzzleAnswerData";

async function postPuzzleAnswer(req: Request, res: Response) : Promise<void> {
  const currentUser = req.authenticatedUser;
  if(!currentUser) {
    res.status(403).send();
    return;
  }

  const dataAccess = req.app.get(DB_CLIENT);
  const {puzzle, value, answerIndex} = req.body;

  const puzzleData = await getPuzzleById(dataAccess, +(puzzle || -1));

  if(!puzzleData) {
    res.status(404).send();
    return;
  }

  if(puzzleData.owner !== currentUser) {
    res.status(401).send();
    return;
  }

  const id = await createPuzzleAnswer(dataAccess, puzzle, value, +answerIndex);

  res.status(201).send(id);
}

async function getPuzzleAnswer(req: Request, res: Response) : Promise<void> {
  const currentUser = req.authenticatedUser;
  if(!currentUser) {
    res.status(403).send();
    return;
  }
  const dataAccess = req.app.get(DB_CLIENT);
  const id = req.params.id;

  const answer = await getPuzzleAnswerById(dataAccess, +id);
  if(!answer) {
    res.send();
    return;
  }
  const puzzle = await getPuzzleById(dataAccess, answer.puzzle);
  if(puzzle.owner !== currentUser) {
    res.status(401).send();
    return;
  }

  res.send(JSON.stringify({
    value: answer.value,
    puzzle: answer.puzzle,
    answerIndex: answer.answerIndex,
  }));
}

export default async function puzzleAnswer(req: Request, res: Response): Promise<void> {
  if(req.method === "POST") {
    return postPuzzleAnswer(req, res);
  }
  if(req.method === "GET") {
    return getPuzzleAnswer(req, res);
  }

  res.status(501).send();
}
