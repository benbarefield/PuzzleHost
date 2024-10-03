import {Pool} from "pg";

interface puzzle {
  id: number
  name: string
  owner: string
}

export async function getPuzzleById(pg : Pool, id: number) : Promise<puzzle> {
  const result = await pg.query("SELECT name, owner FROM puzzles WHERE id = $1", [id]);

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
