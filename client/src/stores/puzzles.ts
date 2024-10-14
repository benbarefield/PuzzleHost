import {ref} from "vue";
import {defineStore} from "pinia";

export interface Puzzle {
  name: string;
  readonly id: string;
  unconfirmed?: boolean
}

// todo: enforce name uniqueness
export const usePuzzleStore = defineStore("puzzles", () => {
  const puzzlesStore = ref<Puzzle[]>([]);
  const loaded = ref<boolean>(false);

  function setPuzzles(puzzles: Puzzle[]) {
    puzzlesStore.value = puzzles;
    loaded.value = true;
  }

  function addPuzzle(puzzle: Puzzle, unconfirmed = false) {
    puzzlesStore.value.push({
      ...puzzle,
      unconfirmed,
    });
  }

  function confirmPuzzleWithId(name: string, newId: string) {
    puzzlesStore.value = puzzlesStore.value.map(p => p.name !== name ? p : {
      ...p,
      id: newId,
      unconfirmed: false,
    });
  }

  return {puzzles:puzzlesStore, loaded, setPuzzles, addPuzzle, confirmPuzzleWithId};
});
