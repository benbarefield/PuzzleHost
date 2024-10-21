import {defineStore} from "pinia";
import {computed, ref} from "vue";

export interface PuzzleAnswer {
  value: string
  puzzle: string
  answerIndex: number
  id: string
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

  const addAnswerToPuzzle = function(puzzleId: string, id: string, answerValue: string, index: number): void {
    let current = answerStore.value[puzzleId];
    // todo: update id, what if added is deleted before add is completed
    answerStore.value[puzzleId] = Array.from({length: current.length + 1}, (_, i) =>
      i < index
        ? current[i]
      : i === index
        ? {
          value: answerValue,
          answerIndex: index,
          puzzle: puzzleId,
          id,
        }
      : {
        ...current[i - 1],
        answerIndex: current[i-1].answerIndex + 1,
      });
  }

  const removeAnswerFromPuzzle = async function(puzzleId: string, index: number): Promise<void> {
    const current = answerStore.value[puzzleId];
    const deleting = current.find(a => a.answerIndex === index);
    if(!deleting) {
      return;
    }
    answerStore.value[puzzleId] = Array.from({length: current.length-1}, (_, i) => i < index
      ? current[i]
      : {
        ...current[i + 1],
        answerIndex: i,
      });

    const response = await fetch(`http://localhost:8888/api/puzzleAnswer/${deleting.id}`, { method: "DELETE" });

    if(response.ok) {
      return;
    }

    answerStore.value[puzzleId] = current;
  }

  return {answers: answerStore, sortedPuzzleAnswers, setAnswersForPuzzle, addAnswerToPuzzle, removeAnswerFromPuzzle};
});
