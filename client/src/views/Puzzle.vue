<script lang="ts" setup>
import {usePuzzleStore} from "@/stores/puzzles";
import {storeToRefs} from "pinia";
import PuzzleAnswerList from "@/components/PuzzleAnswerList.vue";

const props = defineProps<{
    id: string
  }>();

  const puzzleStore = usePuzzleStore();
  const { hasPuzzleData, puzzleNameById } = storeToRefs(puzzleStore);

  if(!hasPuzzleData.value(props.id)) {
    (async () => {
      const response = await fetch(`http://localhost:8888/api/puzzle/${props.id}`);

      const puzzle = await response.json();
      puzzleStore.addPuzzle(puzzle);
      // todo: error (eg. not allowed)
    })();
  }
</script>

<template>
  <div class="loading" v-if="!hasPuzzleData(props.id)" data-test="puzzle-loading">Loading...</div>
  <section v-if="hasPuzzleData(props.id)" class="container">
    <h2 class="header" data-test="puzzle-name">{{puzzleNameById(props.id)}}</h2>
    <PuzzleAnswerList :puzzle="props.id" />
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
</style>
