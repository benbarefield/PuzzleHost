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
    test('responds with a 201 when successful', async () => {
      const puzzleId = (await request(expressApp)
        .post("/api/puzzle")
        .set("Content-Type", "application/json")
        .send(JSON.stringify({name: "my first puzzle" }))).text;

      const response = await request(expressApp)
        .post('/api/puzzleAnswer')
        .send(`puzzle=${puzzleId}&value=5&answerIndex=0`);

      expect(response.status).toEqual(201);
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
        .set("Content-Type", "application/json")
        .send(JSON.stringify({name: "my first puzzle" }))).text;

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
        .set("Content-Type", "application/json")
        .send(JSON.stringify({name: "my first puzzle" }))).text;

      const value = "5";
      const answerIndex = 3;
      const answerId = (await request(expressApp)
        .post('/api/puzzleAnswer')
        .send(`puzzle=${puzzleId}&value=${value}&answerIndex=${answerIndex}`)).text;

      const response = await request(expressApp)
        .get(`/api/puzzleAnswer/${answerId}`);

      expect(response.headers['content-type']).toContain('application/json');
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
        .expect(403, done);
    });

    test('response with 401 when the user does not own the puzzle for the answer', async () => {
      const puzzleId = (await request(expressApp)
        .post("/api/puzzle")
        .set("Content-Type", "application/json")
        .send(JSON.stringify({name: "my first puzzle" }))).text;

      const answerId = (await request(expressApp)
        .post('/api/puzzleAnswer')
        .send(`puzzle=${puzzleId}&value=5&answerIndex=0`)).text;

      userHelper.id = "98765";
      const response = await request(expressApp)
        .get(`/api/puzzleAnswer/${answerId}`);

      expect(response.status).toBe(401);
    });

    test('empty response when there is no puzzle answer', async () => {
      const response = await request(expressApp)
        .get(`/api/puzzleAnswer/1231541`);

      expect(response.text).toEqual("");
    });
  });

  describe('getting the all the answers for a puzzle', () => {
    test('all the answers are retrieved', async () => {
      const puzzleId = (await request(expressApp)
        .post("/api/puzzle")
        .set("Content-Type", "application/json")
        .send(JSON.stringify({name: "my first puzzle" }))).text;

      const answer1 = "5", answer2 = "10";
      await request(expressApp)
        .post('/api/puzzleAnswer')
        .send(`puzzle=${puzzleId}&value=${answer1}&answerIndex=0`);

      await request(expressApp)
        .post('/api/puzzleAnswer')
        .send(`puzzle=${puzzleId}&value=${answer2}&answerIndex=1`);

      const response = await request(expressApp)
        .get(`/api/puzzleAnswer/?puzzle=${puzzleId}`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('application/json');
      const data = JSON.parse(response.text);
      expect(data.find(a => a.answerIndex === 0).value).toBe(answer1)
      expect(data.find(a => a.answerIndex === 1).value).toBe(answer2)
    });

    test('should respond with a 401 if the puzzle is not owned by the user', async () => {
      const puzzleId = (await request(expressApp)
        .post("/api/puzzle")
        .set("Content-Type", "application/json")
        .send(JSON.stringify({name: "my first puzzle" }))).text;

      userHelper.id = "98765";
      const response = await request(expressApp)
        .get(`/api/puzzleAnswer/?puzzle=${puzzleId}`);

      expect(response.status).toBe(401);
    });

    test('should respond with 414 if a puzzle answer id is given with a puzzle id', async () => {
      const puzzleId = (await request(expressApp)
        .post("/api/puzzle")
        .set("Content-Type", "application/json")
        .send(JSON.stringify({name: "my first puzzle" }))).text;

      const answerId = (await request(expressApp)
        .post('/api/puzzleAnswer')
        .send(`puzzle=${puzzleId}&value=5&answerIndex=0`)).text;

      const response = await request(expressApp)
        .get(`/api/puzzleAnswer/${answerId}?puzzle=${puzzleId}`);

      expect(response.status).toBe(414);
    });
  });

  describe("creating answers when answers already exist", () => {
    test('creating an answer in the middle of existing answers updates ordering properly', async () => {
      const puzzleId = (await request(expressApp)
        .post("/api/puzzle")
        .set("Content-Type", "application/json")
        .send(JSON.stringify({name: "my first puzzle" }))).text;

      const answer1 = "1", answer2 = "2", answer3 = "3";
      await request(expressApp)
        .post('/api/puzzleAnswer')
        .send(`puzzle=${puzzleId}&value=${answer1}&answerIndex=0`);

      await request(expressApp)
        .post('/api/puzzleAnswer')
        .send(`puzzle=${puzzleId}&value=${answer3}&answerIndex=1`);

      await request(expressApp)
        .post('/api/puzzleAnswer')
        .send(`puzzle=${puzzleId}&value=${answer2}&answerIndex=1`);

      const response = await request(expressApp)
        .get(`/api/puzzleAnswer/?puzzle=${puzzleId}`);
      const data = JSON.parse(response.text);
      expect(data.find(a => a.answerIndex === 0).value).toBe(answer1);
      expect(data.find(a => a.answerIndex === 1).value).toBe(answer2);
      expect(data.find(a => a.answerIndex === 2).value).toBe(answer3);
    });
  });
});
