import {PostgreSqlContainer} from "@testcontainers/postgresql";
import express from "express";
import SessionStarter from "../data/sessionStarter";
import setupServer from "../serverSetup";
import fakeAuth from "../../test/fakeAuth";
import {
  puzzleAnswerTable as createPuzzleAnswerTable,
  puzzleTable as createPuzzleTable
} from "../../test/pgTableCreationScripts";
import request from "supertest";

describe('querying a puzzle', () => {
  jest.setTimeout(60000);

  let postgresContainer, pg, expressApp;
  let originalUser = "123344567";
  const userHelper = {id: originalUser};

  beforeEach(async () => {
    postgresContainer = await new PostgreSqlContainer().start();
    const connectionUri = postgresContainer.getConnectionUri();

    expressApp = express();

    pg = await SessionStarter(expressApp, connectionUri);
    userHelper.id = originalUser;
    setupServer(expressApp, fakeAuth(userHelper));

    await pg.query(createPuzzleTable);
    await pg.query(createPuzzleAnswerTable)
  });

  afterEach(async () => {
    await pg.end();
    await postgresContainer.stop();
  });

  // todo: 501

  describe('when a puzzle exists with answers', () => {
    test('the response is correct when the provided answer is correct', async() => {
      const puzzleId = (await request(expressApp)
        .post("/api/puzzle")
        .send('name=my+first+puzzle')).text;

      const value1 = "5", value2 = "8", value3 = "10";
      await request(expressApp)
        .post('/api/puzzleAnswer')
        .send(`puzzle=${puzzleId}&value=${value1}&answerIndex=0`);
      await request(expressApp)
        .post('/api/puzzleAnswer')
        .send(`puzzle=${puzzleId}&value=${value3}&answerIndex=2`);
      await request(expressApp)
        .post('/api/puzzleAnswer')
        .send(`puzzle=${puzzleId}&value=${value2}&answerIndex=1`);

      const response = await request(expressApp)
        .get(`/api/queryPuzzle/${puzzleId}/${value1}/${value2}/${value3}`);

      expect(response.status).toBe(200);
      expect(response.text).toBe("Correct");
    });
    //{ '0': '5/8/10', id: '1' }

    test('the response is incorrect when teh provided answer is not correct', async () => {
      const puzzleId = (await request(expressApp)
        .post("/api/puzzle")
        .send('name=my+first+puzzle')).text;

      const value1 = "5", value2 = "8", value3 = "10";
      await request(expressApp)
        .post('/api/puzzleAnswer')
        .send(`puzzle=${puzzleId}&value=${value1}&answerIndex=0`);
      await request(expressApp)
        .post('/api/puzzleAnswer')
        .send(`puzzle=${puzzleId}&value=${value3}&answerIndex=2`);
      await request(expressApp)
        .post('/api/puzzleAnswer')
        .send(`puzzle=${puzzleId}&value=${value2}&answerIndex=1`);

      const response = await request(expressApp)
        .get(`/api/queryPuzzle/${puzzleId}/${value1}/${value3}/${value2}`);

      expect(response.status).toBe(422);
      expect(response.text).toBe("Incorrect");
    });

    test("too many answers results in an incorrect response", async () => {
      const puzzleId = (await request(expressApp)
        .post("/api/puzzle")
        .send('name=my+first+puzzle')).text;

      const value1 = "5", value2 = "8", value3 = "10";
      await request(expressApp)
        .post('/api/puzzleAnswer')
        .send(`puzzle=${puzzleId}&value=${value1}&answerIndex=0`);
      await request(expressApp)
        .post('/api/puzzleAnswer')
        .send(`puzzle=${puzzleId}&value=${value3}&answerIndex=2`);
      await request(expressApp)
        .post('/api/puzzleAnswer')
        .send(`puzzle=${puzzleId}&value=${value2}&answerIndex=1`);

      const response = await request(expressApp)
        .get(`/api/queryPuzzle/${puzzleId}/${value1}/${value2}/${value3}/23423`);

      expect(response.status).toBe(414);
      expect(response.text).toBe("Incorrect");
    });

    test('too few answers results in an incorrect response', async () => {
      const puzzleId = (await request(expressApp)
        .post("/api/puzzle")
        .send('name=my+first+puzzle')).text;

      const value1 = "5", value2 = "8", value3 = "10";
      await request(expressApp)
        .post('/api/puzzleAnswer')
        .send(`puzzle=${puzzleId}&value=${value1}&answerIndex=0`);
      await request(expressApp)
        .post('/api/puzzleAnswer')
        .send(`puzzle=${puzzleId}&value=${value3}&answerIndex=2`);
      await request(expressApp)
        .post('/api/puzzleAnswer')
        .send(`puzzle=${puzzleId}&value=${value2}&answerIndex=1`);

      const response = await request(expressApp)
        .get(`/api/queryPuzzle/${puzzleId}/${value1}/${value3}`);

      expect(response.status).toBe(422);
      expect(response.text).toBe("Incorrect");
    });

    test('response is a 404 when there are no answers setup for the puzzle', async () => {
      const puzzleId = (await request(expressApp)
        .post("/api/puzzle")
        .send('name=my+first+puzzle')).text;

      const response = await request(expressApp)
        .get(`/api/queryPuzzle/${puzzleId}/4654`);

      expect(response.status).toBe(404);
    });
  });
});
