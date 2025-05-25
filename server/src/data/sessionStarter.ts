import {Application} from "express";
import {Pool, PoolClient} from 'pg';
import {puzzleTable, puzzleAnswerTable} from '../../test/pgTableCreationScripts';

export const DB_CLIENT = "dbClient";

export default async function (app: Application, connectionString: string = null): Promise<any> {
  connectionString = connectionString || process.env.PG_CONNECTION;
  const pgClient = new Pool({ connectionString });

  await addTablesIfNotExists(pgClient);

  app.set(DB_CLIENT, pgClient);

  return pgClient;
}

// todo: move to better db migration scheme
const addTablesIfNotExists = async (client: Pool) => {
  await client.query(puzzleTable);
  await client.query(puzzleAnswerTable);
};
