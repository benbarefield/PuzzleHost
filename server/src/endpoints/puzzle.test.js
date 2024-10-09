import {PostgreSqlContainer } from '@testcontainers/postgresql';
import request from 'supertest';
import express from "express";
import SessionStarter from "../data/sessionStarter";
import setupServer from "../serverSetup";
import fakeAuth from "../../test/fakeAuth";
import {puzzleTable as createPuzzleTable} from "../../test/pgTableCreationScripts";

describe("puzzle endpoint", () => {
  jest.setTimeout(60000);

  let postgresContainer, pg, expressApp;
  const userId = {id: "123344567"};

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
        .merge('/api/puzzle')
        .expect(501, done);
    });
  });

  describe("when a puzzle has been successfully created", () => {
    test('the response is a 201', (done) => {
      request(expressApp)
        .post("/api/puzzle")
        .send('name=my+first+puzzle')
        .expect(201, done);
    });
    test('the response includes an id for the puzzle', async () => {
      const response = await request(expressApp)
        .post("/api/puzzle")
        .send('name=my+first+puzzle');

      expect(response.text).toBeTruthy();
    });
  });

  describe("after creating a puzzle", () => {
    test("it can be retrieved", async () => {
      const puzzleName = "my first puzzle";

      const createResponse = await request(expressApp)
        .post("/api/puzzle")
        .send(`name=${puzzleName.replace(' ', '+')}`)
        .set('Accept', 'application/json');

      const getResponse = await request(expressApp)
        .get(`/api/puzzle/${createResponse.text}`)
        .set('Accept', 'application/json');

      const data = JSON.parse(getResponse.text);

      expect(data.name).toEqual(puzzleName);
    });
  });
});
