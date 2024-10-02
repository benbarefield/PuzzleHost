import {Application, NextFunction, Request, Response} from "express";
import {Pool} from 'pg';

export const DB_CLIENT = "dbClient";

export default async function (app: Application, connectionString: string = null): Promise<any> {
  connectionString = connectionString || process.env.PG_CONNECTION;
  const pgClient = new Pool({ connectionString });

  // test the connection
  const client = await pgClient.connect();
  client.release();

  app.set(DB_CLIENT, pgClient);

  return pgClient;
}
