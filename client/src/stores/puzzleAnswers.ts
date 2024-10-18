import {defineStore} from "pinia";
import {computed, ref} from "vue";

export interface PuzzleAnswer {
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

  const setAnswersForPuzzle = function(puzzleId: string, answers: PuzzleAnswer[]): void {
    answerStore.value[puzzleId] = answers.map(a => ({...a}));
  }

  const addAnswerToPuzzle = function(puzzleId: string, answerValue: string, index: number): void {
    let current = answerStore.value[puzzleId];
    answerStore.value[puzzleId] = Array.from({length: current.length + 1}, (_, i) =>
      i < index
        ? current[i]
      : i === index
        ? {
          value: answerValue,
          answerIndex: index,
          puzzle: puzzleId,
        }
      : {
        ...current[i - 1],
        answerIndex: current[i-1].answerIndex + 1,
      });
  }

  return {answers: answerStore, sortedPuzzleAnswers, setAnswersForPuzzle, addAnswerToPuzzle};
});
