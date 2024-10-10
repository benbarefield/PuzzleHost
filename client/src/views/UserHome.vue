<script lang="ts" setup>
  const puzzles = [{name: "one", id: "1"}, {name: "two", id: "1"}, {name:"three", id: "1"}];
</script>

<template>
  <section class="container">
    <h2 class="header">Your Puzzles</h2>
    <ul class="puzzle-list">
      <li v-for="puzzle in puzzles" class="puzzle">
        <RouterLink :to="`/puzzle/${puzzle.id}`">{{puzzle.name}}</RouterLink>
      </li>
    </ul>
    <button class="create-puzzle">Create Puzzle</button>
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

  .puzzle-list {
    border-width: 0 2px 0 2px;
    border-color: var(--color-border);
    border-style: solid;
    border-radius: 6px;
    list-style-type: none;
    padding: 4px;
  }

  .puzzle a {
    display: block;
    height: 2em;
    line-height: 2em;
    width: 100%;
    border: 1px solid var(--color-border);
    border-radius: 3px;
    padding: 0 4px;
  }

  .create-puzzle {
    display: block;
    height: 2em;
    width: 100%;
    background: none;
    border: 3px solid var(--color-border);
    transition: height 0.3s;
    margin: 0;
    padding: 0;
    cursor: pointer;
    color: var(--color-text);
    line-height: 2em;
    font-weight: 600;
  }
</style>
