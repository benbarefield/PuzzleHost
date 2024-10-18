<script lang="ts" setup>
  import {usePuzzleStore} from "@/stores/puzzles";
  import {usePuzzleAnswersStore} from "@/stores/puzzleAnswers";
  import {storeToRefs} from "pinia";
  import {computed, onUpdated, ref} from "vue";
  import {useTemplateRef} from "vue";

  const props = defineProps<{
    id: string
  }>();
  const newAnswerDialogRef = useTemplateRef("newAnswerDialog");
  const newAnswerValueRef = useTemplateRef("newAnswerValue");

  const addingAnswerAt = ref(-1);
  const processingAdd = ref(false);
  const puzzleStore = usePuzzleStore();
  const { hasPuzzleData, puzzleNameById } = storeToRefs(puzzleStore);

  const answersStore = usePuzzleAnswersStore();
  const { sortedPuzzleAnswers } = storeToRefs(answersStore);
  const hasAnswers = computed(() => !!sortedPuzzleAnswers.value(props.id));
  const answerListItems = computed(() => {
    const answers = sortedPuzzleAnswers.value(props.id);
    return !!answers
        ? Array.from({length: answers.length * 2 + 1}, (_, i) => i % 2 === 0 ? null : answers[Math.floor(i / 2)])
        : null;
  });

  async function retrievePuzzleAnswers() {
    const response = await fetch(`http://localhost:8888/api/puzzleAnswer/?puzzle=${props.id}`);

    const answers = await response.json();

    usePuzzleAnswersStore().setAnswersForPuzzle(props.id, answers);
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
        puzzle: props.id,
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

    usePuzzleAnswersStore().addAnswerToPuzzle(props.id, answerValue, addAt);
    newAnswerDialogRef.value?.close?.();
  }

  const puzzleExists = hasPuzzleData.value(props.id);
  if(!puzzleExists) {
    (async () => {
      const response = await fetch(`http://localhost:8888/api/puzzle/${props.id}`);

      const puzzle = await response.json();
      puzzleStore.addPuzzle(puzzle);
      // todo: error (eg. not allowed)
    })();
  }

  if(puzzleExists && !hasAnswers.value) {
    retrievePuzzleAnswers();
  }

  onUpdated(() => {
    const {puzzles} = storeToRefs(usePuzzleStore());
    if(hasPuzzleData.value(props.id) && !hasAnswers.value) {
      retrievePuzzleAnswers();
    }
  });
</script>

<template>
  <div class="loading" v-if="!hasPuzzleData(props.id)" data-test="puzzle-loading">Loading...</div>
  <section v-if="hasPuzzleData(props.id)" class="container">
    <h2 class="header" data-test="puzzle-name">{{puzzleNameById(props.id)}}</h2>
    <div v-if="!hasAnswers" class="loading" data-test="answers-loading">Loading...</div>
    <ul v-if="hasAnswers" class="answerList">
      <li v-for="(answer, index) in answerListItems">
        <p v-if="answer !== null" class="answer">{{answer.value}}</p>
        <button v-if="answer === null" @click="() => openNewAnswerDialog(index / 2)">+</button>
      </li>
    </ul>
  </section>
  <dialog ref="newAnswerDialog" class="newAnswerDialog">
    <label>
      Answer value: <input ref="newAnswerValue" />
    </label>
    <button :disabled="processingAdd" @click="createNewPuzzleAnswer">Add Answer</button>
  </dialog>
</template>

<style scoped>
  .container {
    width: 50vw;
    margin: 50px auto 0 auto;
  }

  .header {
    margin-bottom: 8px;
    padding-left: 4px;
  }

  .answerList {
    border-width: 0 2px 0 2px;
    border-color: var(--color-border);
    border-style: solid;
    border-radius: 6px;
    list-style-type: none;
    padding: 4px;
  }

  .answer {
    height: 2em;
    line-height: 2em;
    width: 100%;
    border: 1px solid var(--color-border);
    border-radius: 3px;
    padding: 0 4px;
    color: var(--color-text);
    text-align: center;
  }

  .answerList button {
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
  .answerList button:hover {
    height: 1.5em;
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
