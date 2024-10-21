import {Pool} from "pg";

interface puzzleAnswer {
  id: number
  value: string
  puzzle: number
  answerIndex: number
}

export async function createPuzzleAnswer(pg: Pool, puzzle: number, value: string, answerIndex: number): Promise<number> {
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

export async function removePuzzleAnswer(pg: Pool, id: number): Promise<boolean> {
  const currentRecord = await getPuzzleAnswerById(pg, id);
  if(!currentRecord) {
    return false;
  }
  
  const client = await pg.connect();
  try {
    await client.query("BEGIN");
    await client.query('UPDATE puzzle_answers SET answer_index = answer_index - 1 WHERE answer_index > $1', [currentRecord.answerIndex]);
    await pg.query("DELETE from puzzle_answers WHERE id = $1", [id]);
    await client.query("COMMIT");
  }
  catch(e) {
    await client.query("ROLLBACK");
    throw e;
  }
  finally {
    client.release();
  }

  return true;
}

export async function updatePuzzleAnswer(pg: Pool, id: number, value: string | undefined, answerIndex: number | undefined) : Promise<boolean> {
  let updateString = "";
  let updates = [];
  if(value !== undefined) {
    updateString += " value = $1 ";
    updates.push(value);
  }
  if(answerIndex !== undefined) {
    updateString += " answer_index = $2";
    updates.push(answerIndex);
  }

  if(updates.length === 0) {
    return true;
  }

  updates.push(id);
  if(answerIndex === undefined) {
    const result  = await pg.query(`UPDATE puzzle_answers SET ${updateString} WHERE id = $${updates.length}`, updates);
    return result.rowCount > 0;
  }

  const current = await getPuzzleAnswerById(pg, id);
  if(!current) { return false; } // todo: test? ----- test value updates with answerId, and value updates with same answerId
  if(current.answerIndex === answerIndex && updates.length === 2) {
    return true;
  }
  const client = await pg.connect();
  try {
    await client.query("BEGIN");

    if(answerIndex < current.answerIndex) {
      await client.query('UPDATE puzzle_answers SET answer_index = answer_index + 1 WHERE answer_index <= $1', [answerIndex]);
    } else {
      await client.query('UPDATE puzzle_answers SET answer_index = answer_index - 1 WHERE answer_index >= $1', [answerIndex]);
    }

    await client.query(`UPDATE puzzle_answers SET ${updateString} WHERE id = $${updates.length}`, updates);
    await client.query("COMMIT");
  }
  catch(e) {
    await client.query("ROLLBACK");
    throw e;
  }
  finally {
    client.release();
  }

  return true;
}

export async function getAnswersForPuzzle(pg: Pool, puzzleId: number) : Promise<puzzleAnswer[]> {
  const result = await pg.query('SELECT id, value, answer_index from puzzle_answers WHERE puzzle=$1', [puzzleId]);

  return result.rows.map(r => ({
    id: r.id,
    value: r.value,
    answerIndex: r.answer_index,
    puzzle: puzzleId
  }));
}
