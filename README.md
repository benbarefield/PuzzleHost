A website for creating puzzles that can be queried from anywhere

## Getting started
Run `npm i` from both the `/client` and `/server`

Create an .env as described below

To run locally (after fulfilling any below requirements):
* `npm run dev` in `/client`
* `npm run start` in `/server`

## .env
Create a `.env` file in `/server` with the following entries:

* `PG_CONNECTION` : the connection string for postgres, eg. `postgres://user:password@localhost:5432/postgres`

