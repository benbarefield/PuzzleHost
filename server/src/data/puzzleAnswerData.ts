import {Pool} from "pg";

interface puzzleAnswer {
  id: number
  value: string
  puzzle: number
  answerIndex: number
}

export async function createPuzzleAnswer(pg: Pool, puzzle: string, value: string, answerIndex: number): Promise<number> {
  const result = await pg.query('INSERT INTO puzzle_answers (puzzle, value, answer_index) VALUES ($1, $2, $3) RETURNING id', [puzzle, value, answerIndex]);

  return result.rows[0].id;
}

export async function getPuzzleAnswerById(pg: Pool, id: number) : Promise<puzzleAnswer> {
  const result = await pg.query('SELECT value, puzzle, answer_index from puzzle_answers WHERE id = $1', [id]);

  if(!result.rows.length) { return null; }

  return {
    id,
    value: result.rows[0].value,
    puzzle: result.rows[0].puzzle,
    answerIndex: result.rows[0].answer_index,
  };
}
