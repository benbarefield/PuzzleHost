import {Pool} from "pg";

interface puzzle {
  id: number
  name: string
  owner: string
}

export async function getPuzzleById(pg : Pool, id: number) : Promise<puzzle> {
  const result = await pg.query("SELECT name, owner FROM puzzles WHERE id = $1 AND deleted != true", [id]);

  if(!result.rows.length) { return null; }

  return {
    id,
    name: result.rows[0].name,
    owner: result.rows[0].owner,
  };
}

export async function createPuzzle(pg: Pool, name: string, ownerId: string): Promise<number> {
  const result = await pg.query("INSERT INTO puzzles (name, owner) VALUES ($1, $2) RETURNING id", [name, ownerId]);

  return result.rows[0].id;
}

// todo: pagination
export async function getPuzzlesForUser(pg: Pool, userId: string): Promise<puzzle[]> {
  const result = await pg.query("SELECT id, name FROM puzzles WHERE owner=$1", [userId]);

  return result.rows.map(r => ({
    id: r.id,
    name: r.name,
    owner: userId,
  }));
}

export async function verifyPuzzleOwnership(pg: Pool, puzzleId: number, userId: string): Promise<boolean> {
  const puzzle = await getPuzzleById(pg, puzzleId);

  return puzzle && puzzle.owner === userId;
}

export async function markPuzzleAsDeleted(pg: Pool, puzzleId: number): Promise<boolean> {
  const result = await pg.query("UPDATE puzzles SET deleted = true WHERE id = $1", [puzzleId]);

  return result.rowCount > 0;
}

export async function updatePuzzle(pg: Pool, puzzleId: number, name: string): Promise<boolean> {
  const result = await pg.query(`UPDATE puzzles SET name = $1 where id = $2`, [name, puzzleId]);

  return result.rowCount > 0;
}
