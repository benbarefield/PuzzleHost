import {PostgreSqlContainer} from "@testcontainers/postgresql";
import express from "express";
import SessionStarter from "../data/sessionStarter";
import setupServer from "../serverSetup";
import fakeAuth from "../../test/fakeAuth";
import {puzzleTable as createPuzzleTable, puzzleAnswerTable as createPuzzleAnswerTable} from "../../test/pgTableCreationScripts";
import request from "supertest";;

describe('puzzle answer endpoint', () => {
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
  })

  describe('unsupported endpoints', () => {
    test('should send status 501', (done) => {
      request(expressApp)
        .merge('/api/puzzleAnswer')
        .expect(501, done);
    });
  });

  describe("creating a puzzle answer", () => {
    test('responds with a 200 when successful', async () => {
      const puzzleId = (await request(expressApp)
        .post("/api/puzzle")
        .send('name=my+first+puzzle')).text;

      const response = await request(expressApp)
        .post('/api/puzzleAnswer')
        .send(`puzzle=${puzzleId}&value=5&answerIndex=0`);

      expect(response.status).toEqual(200);
    });

    test('response with 404 when the puzzle does not exist', (done) => {
      request(expressApp)
        .post('/api/puzzleAnswer')
        .send(`puzzle=545895436&value=5&answerIndex=0`)
        .expect(404, done);
    });

    test('responds with 401 when the user does not own the puzzle', async () => {
      const puzzleId = (await request(expressApp)
        .post("/api/puzzle")
        .send('name=my+first+puzzle')).text;

      userHelper.id = "234524";
      const response = await request(expressApp)
        .post('/api/puzzleAnswer')
        .send(`puzzle=${puzzleId}&value=5&answerIndex=0`);

      expect(response.status).toBe(401);
      // todo: verify nothing is put in db?
    });

    // todo: add 403 to puzzle and userPuzzles
    test('responds with 403 when no user is logged in', (done) => {
      userHelper.id = undefined;
      request(expressApp)
        .post('/api/puzzleAnswer')
        .send(`puzzle=123123123&value=5&answerIndex=0`)
        .expect(403, done);
    });
  });

  describe('getting a puzzle answer', () => {
    test('the answer data is returned', async () => {
      const puzzleId = (await request(expressApp)
        .post("/api/puzzle")
        .send('name=my+first+puzzle')).text;

      const value = "5";
      const answerIndex = 3;
      const answerId = (await request(expressApp)
        .post('/api/puzzleAnswer')
        .send(`puzzle=${puzzleId}&value=${value}&answerIndex=${answerIndex}`)).text;

      const response = await request(expressApp)
        .get(`/api/puzzleAnswer/${answerId}`)
        .set('Accept', 'application/json');

      const data = JSON.parse(response.text);
      expect(response.status).toEqual(200);
      expect(data).toEqual({
        value,
        answerIndex,
        puzzle: puzzleId,
      });
    });

    test('responds with 403 when no user is logged in', (done) => {
      userHelper.id = undefined;

      request(expressApp)
        .get(`/api/puzzleAnswer/123412512`)
        .set('Accept', 'application/json')
        .expect(403, done);
    });

    test('response with 401 when the user does not own the puzzle for the answer', async () => {
      const puzzleId = (await request(expressApp)
        .post("/api/puzzle")
        .send('name=my+first+puzzle')).text;

      const answerId = (await request(expressApp)
        .post('/api/puzzleAnswer')
        .send(`puzzle=${puzzleId}&value=5&answerIndex=0`)).text;

      userHelper.id = "98765";
      const response = await request(expressApp)
        .get(`/api/puzzleAnswer/${answerId}`)
        .set('Accept', 'application/json');

      expect(response.status).toBe(401);
    });

    test('empty response when there is no puzzle answer', async () => {
      const response = await request(expressApp)
        .get(`/api/puzzleAnswer/1231541`)
        .set('Accept', 'application/json');

      expect(response.text).toEqual("");
    });
  });
});
