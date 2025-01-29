<script setup lang="ts">
import {computed, ref, useTemplateRef} from "vue";
import {usePuzzleAnswersStore} from "@/stores/puzzleAnswers";
import {storeToRefs} from "pinia";

  const props = defineProps<{
    puzzle: string
  }>();

  const newAnswerDialogRef = useTemplateRef("newAnswerDialog");
  const newAnswerValueRef = useTemplateRef("newAnswerValue");

  const addingAnswerAt = ref(-1);
  const processingAdd = ref(false);

  const answersStore = usePuzzleAnswersStore();
  const { sortedPuzzleAnswers } = storeToRefs(answersStore);
  const hasAnswers = computed(() => !!sortedPuzzleAnswers.value(props.puzzle));
  const answerListItems = computed(() => {
    const answers = sortedPuzzleAnswers.value(props.puzzle);
    return !!answers
        ? Array.from({length: answers.length * 2 + 1}, (_, i) => i % 2 === 0 ? null : answers[Math.floor(i / 2)])
        : null;
  });

  async function retrievePuzzleAnswers() {
    const response = await fetch(`http://localhost:8888/api/puzzleAnswer/?puzzle=${props.puzzle}`);

    const answers = await response.json();

    usePuzzleAnswersStore().setAnswersForPuzzle(props.puzzle, answers);
    // todo: error
  }

  function openNewAnswerDialog(atIndex: number) {
    newAnswerDialogRef.value?.showModal?.();
    newAnswerValueRef.value?.focus();
    addingAnswerAt.value = atIndex;
  }

  async function createNewPuzzleAnswer() {
    const answerValue = newAnswerValueRef.value?.value || "";
    const addAt = addingAnswerAt.value; // maybe add a test to show justification for this
    // todo: allow blank values?

    processingAdd.value = true;
    const response = await fetch('http://localhost:8888/api/puzzleAnswer', {
      method: "POST",
      body: JSON.stringify({
        puzzle: props.puzzle,
        value: answerValue,
        answerIndex: addAt,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    processingAdd.value = false;
    if(!response.ok) {
      // todo: error
      return;
    }

    const id = await response.text();
    usePuzzleAnswersStore().addAnswerToPuzzle(props.puzzle, id, answerValue, addAt);
    if(newAnswerValueRef.value) {
      newAnswerValueRef.value.value = "";
    }
    newAnswerDialogRef.value?.close?.();
  }

  function removeAnswer(answerIndex: number) {
    usePuzzleAnswersStore().removeAnswerFromPuzzle(props.puzzle, answerIndex);
  }

  if(!hasAnswers.value) {
    retrievePuzzleAnswers();
  }
</script>

<template>
  <div v-if="!hasAnswers" class="loading" data-test="answers-loading">Loading...</div>
  <ul v-if="hasAnswers" class="answerList">
    <li v-for="(answer, index) in answerListItems">
      <p v-if="answer !== null" class="answer">{{answer.value}}<button class="delete" data-test="delete" @click="() => removeAnswer((index - 1) / 2)">remove</button></p>
      <button v-if="answer === null" @click="() => openNewAnswerDialog(index / 2)" data-test="add" class="create">+</button>
    </li>
  </ul>
  <dialog ref="newAnswerDialog" class="newAnswerDialog">
    <label>
      Answer value: <input ref="newAnswerValue" />
    </label>
    <button :disabled="processingAdd" @click="createNewPuzzleAnswer">Add Answer</button>
  </dialog>
</template>

<style scoped>
  .answerList {
    border-width: 0 2px 0 2px;
    border-color: var(--color-border);
    border-style: solid;
    border-radius: 6px;
    list-style-type: none;
    padding: 4px;
  }

  .answer {
    height: 40px;
    line-height: 2em;
    width: 100%;
    border: 1px solid var(--color-border);
    border-radius: 3px;
    padding: 0 4px;
    color: var(--color-text);
    text-align: center;
    position: relative;
  }

  .delete {
    height: 16px;
    width: 16px;
    color: transparent;
    background-color: #f60f3b;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    font-size: 0;
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
  }
  .delete::before {
    content: "x";
    color: #fff;
    font-size: 14px;
    position: absolute;
    left: 50%;
    top: 40%;
    transform: translate(-50%, -50%);
  }

  .create {
    display: block;
    height: 0;
    width: 100%;
    background: none;
    border: 3px solid var(--color-border);
    transition: height 0.3s;
    margin: 0;
    padding: 0;
    cursor: pointer;
    overflow: hidden;
    color: var(--color-text);
    font-size: 0.875em;
    line-height: 1em;
    font-weight: 600;
  }
  .create:hover {
    height: 40px;
  }
  .answerList li:only-child .create {
    height: 40px;
  }

  .newAnswerDialog {
    padding: 50px;
    border-radius: 6px;
    margin: auto;
  }
  .newAnswerDialog::backdrop {
    background-color: rgba(0, 0, 0, 0.3);
  }
</style>
