import {Request, Response} from "express";
import {getAnswersForPuzzle} from "../data/puzzleAnswerData";
import {DB_CLIENT} from "../data/sessionStarter";

export default async function(req: Request, res: Response): Promise<void> {
  if(req.method !== "GET") {
    res.status(501).send();
    return;
  }

  const dataAccess = req.app.get(DB_CLIENT);
  const puzzleId = +req.params.id;

  const answers = await getAnswersForPuzzle(dataAccess, puzzleId);
  if(answers.length === 0) {
    res.status(404).send();
    return;
  }
  answers.sort((a, b) => a.answerIndex - b.answerIndex);

  const providedAnswers = req.params[0].split('/');

  if(providedAnswers.length > answers.length) {
    res.status(414).send("Incorrect");
    return;
  }

  for(let i = 0; i < answers.length; i++) {
    if(answers[i].value != providedAnswers[i]) {
      res.status(422).send("Incorrect");
      return;
    }
  }

  res.status(200).send("Correct");
}
