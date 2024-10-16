import {PostgreSqlContainer } from '@testcontainers/postgresql';
import request from 'supertest';
import express from "express";
import SessionStarter from "../data/sessionStarter";
import setupServer from "../serverSetup";
import fakeAuth from "../../test/fakeAuth";
import {puzzleTable as createPuzzleTable} from "../../test/pgTableCreationScripts";

describe("user puzzles endpoint", () => {
  jest.setTimeout(60000);

  let postgresContainer, pg, expressApp;
  const user1 = "76541258";
  const userId = {id: user1};

  beforeEach(async () => {
    postgresContainer = await new PostgreSqlContainer().start();
    const connectionUri = postgresContainer.getConnectionUri();

    expressApp = express();

    pg = await SessionStarter(expressApp, connectionUri);
    setupServer(expressApp, fakeAuth(userId));

    await pg.query(createPuzzleTable);
  });

  afterEach(async () => {
    await pg.end();
    await postgresContainer.stop();
  });

  describe('unsupported endpoints', () => {
    test('should send status 501', (done) => {
      request(expressApp)
        .merge('/api/userPuzzles')
        .expect(501, done);
    });
  });

  describe("after creating puzzles", () => {
    test("they can be retrieved for the logged in user", async () => {
      const puzzle1 = "my first puzzle";
      const puzzle2 = "another puzzle";

      const puzzle1Id = (await request(expressApp)
        .post("/api/puzzle")
        .send(`name=${puzzle1.replace(' ', '+')}`)).text;

      const puzzle2Id = (await request(expressApp)
        .post("/api/puzzle")
        .send(`name=${puzzle2.replace(' ', '+')}`)).text;

      const getResponse = await request(expressApp)
        .get(`/api/userPuzzles`);

      expect(getResponse.headers['content-type']).toContain("application/json");

      const data = JSON.parse(getResponse.text);
      expect(data).toEqual([
        {name: puzzle1, id: puzzle1Id},
        {name: puzzle2, id: puzzle2Id},
      ]);
    });

    test('puzzles from other users are not retrieved', async () => {
      const puzzle1 = "my first puzzle";
      const puzzle2 = "another puzzle";

      await request(expressApp)
        .post("/api/puzzle")
        .send(`name=${puzzle1.replace(' ', '+')}`);

      userId.id = "52562345235";
      await request(expressApp)
        .post("/api/puzzle")
        .send(`name=${puzzle2.replace(' ', '+')}`);

      userId.id = user1;
      const getResponse = await request(expressApp)
        .get(`/api/userPuzzles`);

      const data = JSON.parse(getResponse.text);

      expect(data.length).toEqual(1);
      expect(data[0].name).toEqual(puzzle1);
    });
  });
});
