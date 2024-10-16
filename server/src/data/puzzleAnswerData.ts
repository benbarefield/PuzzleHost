import {Pool} from "pg";

interface puzzleAnswer {
  id: number
  value: string
  puzzle: number
  answerIndex: number
}

export async function createPuzzleAnswer(pg: Pool, puzzle: string, value: string, answerIndex: number): Promise<number> {
  const client = await pg.connect();

  let newId: number = -1;
  try {
    await client.query("BEGIN");
    await client.query('UPDATE puzzle_answers SET answer_index = answer_index + 1 WHERE answer_index >= $1', [answerIndex]);
    const result = await client.query('INSERT INTO puzzle_answers (puzzle, value, answer_index) VALUES ($1, $2, $3) RETURNING id', [puzzle, value, answerIndex]);
    newId = result.rows[0].id
    await client.query("COMMIT");
  }
  catch(e) {
    await client.query("ROLLBACK");
    throw e;
  }
  finally {
    client.release();
  }

  return newId;
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

export async function getAnswersForPuzzle(pg: Pool, puzzleId: number) : Promise<puzzleAnswer[]> {
  const result = await pg.query('SELECT value, answer_index from puzzle_answers WHERE puzzle=$1', [puzzleId]);

  // if(!result.rows.length) { return []; }

  return result.rows.map(r => ({
    id: -1,
    value: r.value,
    answerIndex: r.answer_index,
    puzzle: puzzleId
  }));
}
