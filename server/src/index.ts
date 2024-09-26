import express from "express";
import puzzleEndpoint from './endpoints/puzzle';

const port = 8888;
const app = express();

app.use(express.json());

puzzleEndpoint(app);

app.listen(port, () => {
  console.log(`Server started on port: ${port}
ctrl+c to quit
`);
});
