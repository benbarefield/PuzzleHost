import {Application, Request, Response} from 'express';
import * as crypto from 'crypto';

async function createPuzzle(req: Request, res: Response): Promise<any> {
  const id = crypto.randomUUID();



  res.send(id);
}

export default function(apiPath: string, app: Application): void {
  app.post("/" + apiPath, createPuzzle);
}
