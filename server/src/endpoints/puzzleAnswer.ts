import { Request, Response} from "express";
import {DB_CLIENT} from "../data/sessionStarter";
import {getPuzzleById, verifyPuzzleOwnership} from "../data/puzzleData";
import {createPuzzleAnswer, getAnswersForPuzzle, getPuzzleAnswerById} from "../data/puzzleAnswerData";

async function postPuzzleAnswer(req: Request, res: Response) : Promise<void> {
  const currentUser = req.authenticatedUser;
  if(!currentUser) {
    res.status(403).send();
    return;
  }

  const dataAccess = req.app.get(DB_CLIENT);
  const {puzzle, value, answerIndex}: {puzzle: number, value: string, answerIndex: number} = req.body;

  if(isNaN(puzzle)) {
    res.status(400).send("Invalid puzzle id");
    return;
  }

  const puzzleData = await getPuzzleById(dataAccess, puzzle);

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
  let puzzleId = +req.query.puzzle;
  const answerId = +req.params.id;
  if((puzzleId || puzzleId === 0) && answerId) {
    res.status(414).send("Unsupported to get a puzzle answer by puzzle id and answer id");
    return;
  }

  if(isNaN(puzzleId) && isNaN(answerId)) {
    res.status(400).send("Invalid puzzle Id or answer Id");
    return;
  }

  let dataToSend: string;
  if(!puzzleId && puzzleId !== 0) { // support for id = 0?
    const answer = await getPuzzleAnswerById(dataAccess, answerId);
    if(!answer) {
      // should this actually 404?
      res.send();
      return;
    }

    dataToSend = JSON.stringify({
      value: answer.value,
      puzzle: answer.puzzle,
      answerIndex: answer.answerIndex,
    });
    puzzleId = answer.puzzle;
  }

  const ownershipVerified = await verifyPuzzleOwnership(dataAccess, puzzleId, currentUser);
  if(!ownershipVerified) {
    res.status(401).send();
    return;
  }

  if(!dataToSend) {
    const answers = await getAnswersForPuzzle(dataAccess, puzzleId);

    dataToSend = JSON.stringify(answers.map(p => ({
      value: p.value,
      puzzle: p.puzzle,
      answerIndex: p.answerIndex,
    })));
  }

  res.set('Content-Type', 'application/json');
  res.send(dataToSend);
}


export default async function puzzleAnswer(req: Request, res: Response): Promise<void> {
  if(req.method === "OPTIONS") {
    res.status(204).send();
  }

  if(req.method === "POST") {
    return postPuzzleAnswer(req, res);
  }
  if(req.method === "GET") {
    return getPuzzleAnswer(req, res);
  }

  res.status(501).send();
}
