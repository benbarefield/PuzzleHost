import {usePuzzleStore} from "@/stores/puzzles";

const sockets: {
  [key: string]: WebSocket
} = {};

export function startListening(puzzleId: string) {
  if(sockets[puzzleId]) { return; }

  const socket = new WebSocket(`ws://localhost:8888/puzzle/${puzzleId}`);
  socket.addEventListener("error", e => console.log("booo", e));
  socket.addEventListener("open", () => console.log("woohoo!"))
  sockets[puzzleId] = socket;
  socket.addEventListener("message", e => {
    usePuzzleStore().puzzleQueried(puzzleId, e.data);
  });
}

export function stopListening(puzzleId: string): void {
  if(!sockets[puzzleId]) {return;}

  sockets[puzzleId].close();
  delete sockets[puzzleId];
}
