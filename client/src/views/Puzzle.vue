<script lang="ts" setup>
import {usePuzzleStore} from "@/stores/puzzles";
import {usePuzzleAnswersStore} from "@/stores/puzzleAnswers";
import {onUpdated} from "vue";
import {storeToRefs} from "pinia";

const props = defineProps<{
    id: string
  }>();

  const puzzleStore = usePuzzleStore();
  const { hasPuzzleData, puzzleNameById } = storeToRefs(puzzleStore);
  // const puzzleExists = puzzleStore.hasPuzzleData(props.id);
  // const puzzleName = puzzleStore.puzzleNameById(props.id);

  const answersStore = usePuzzleAnswersStore();
  const { sortedPuzzleAnswers } = storeToRefs(answersStore);
  const answers = sortedPuzzleAnswers.value(props.id);

  if(!hasPuzzleData.value(props.id)) { // this isn't a great "existence" check...
    (async () => {
      const response = await fetch(`http://localhost:8888/api/puzzle/${props.id}}`);

      const puzzle = await response.json();
      puzzleStore.addPuzzle(puzzle);
      // todo: error (eg. not allowed)
    })();
  }
  // const answerList = Array.from({length: answers.length * 2}, (_, i) => i % 2 === 0 ? answers[i / 2] : null);
</script>

<template>
  <div class="loading" v-if="!hasPuzzleData(props.id)" data-test="puzzle-loading">Loading...</div>
  <section v-if="hasPuzzleData(props.id)" class="container">
    <h2 class="header" data-test="puzzle-name">{{puzzleNameById(props.id)}}</h2>
    <div v-if="!answers" class="loading" data-test="answers-loading">Loading...</div>
    <ul v-if="!!answers" class="answer-list">
      <li v-for="answer in answers" class="answer">
        <p>{{answer.value}}</p>
<!--        <button v-if="answer === null">+</button>-->
      </li>
    </ul>
  </section>
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

.answer-list {
  border-width: 0 2px 0 2px;
  border-color: var(--color-border);
  border-style: solid;
  border-radius: 6px;
  list-style-type: none;
  padding: 4px;
}

.answer p {
  height: 2em;
  line-height: 2em;
  width: 100%;
  border: 1px solid var(--color-border);
  border-radius: 3px;
  padding: 0 4px;
  color: var(--color-text);
  text-align: center;
}

.answer button {
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
.answer button:hover {
  height: 1.5em;
}
</style>
