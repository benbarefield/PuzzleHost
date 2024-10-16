import {defineStore} from "pinia";
import {computed, ref} from "vue";

export interface PuzzleAnswer {
  id: string
  value: string
  puzzle: string
  answerIndex: number
}

export const usePuzzleAnswersStore = defineStore("puzzleAnswers", () => {
  const answerStore = ref<Record<string, PuzzleAnswer[]>>({});

  const sortedPuzzleAnswers = computed(() => ((puzzleId: string): PuzzleAnswer[] | null => {
    if(!answerStore.value[puzzleId]) { return null; }
    const answers = [...answerStore.value[puzzleId]];
    answers.sort((a,b) => a.answerIndex - b.answerIndex);
    return answers;
  }));

  return {answers: answerStore, sortedPuzzleAnswers};
});
