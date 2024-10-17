<script lang="ts" setup>
  import {type Puzzle, usePuzzleStore} from "@/stores/puzzles";
  import {storeToRefs} from "pinia";
  import {useTemplateRef} from "vue";

  const store = usePuzzleStore();
  const {puzzles,loaded} = storeToRefs(store);

  const dialogRef = useTemplateRef("create-dialog");
  const nameRef = useTemplateRef("create-name");
  function openCreateDialog(): void {
    dialogRef.value.showModal();
    nameRef.value.focus();
  }

  async function sendCreatePuzzle() {
    const name = nameRef.value.value;
    dialogRef.value.close?.(); // tests not supporting dialog element

    store.addPuzzle({
      name,
      id: "0",
    }, true);

    const response = await fetch("http://localhost:8888/api/puzzle", {
      method: "POST",
      body: JSON.stringify({
        name,
      }),
      headers: {
        "Content-Type": "application/json",
      }
    });

    if(response.ok) {
      const id = await response.text();
      store.confirmPuzzleWithId(name, id);
    }
  }

  if(puzzles.value.length === 0) {// when to retrieve puzzles again?
    (async () => {
      try {
        const response = await fetch("http://localhost:8888/api/userPuzzles");

        const puzzles: Puzzle[] = await response.json();
        store.setPuzzles(puzzles);
      }
      catch(e) {
        //todo: error handling
        console.log(e)
      }
    })();
  }
</script>

<template>
  <section class="container">
    <h2 class="header">Your Puzzles</h2>
    <div v-if="!loaded" class="borderedContainer">
      <p class="loading">loading...</p>
    </div>
    <ul v-if="loaded && puzzles.length > 0" class="puzzleList borderedContainer">
      <li v-for="puzzle in puzzles" class="puzzle">
        <RouterLink v-if="!puzzle.unconfirmed" :to="`/puzzle/${puzzle.id}`">{{puzzle.name}}</RouterLink>
        <span v-if="puzzle.unconfirmed">{{puzzle.name}} [pending...]</span>
      </li>
      <li>
        <button class="createPuzzle" @click="openCreateDialog">Create Puzzle</button>
      </li>
    </ul>
    <div v-if="loaded && puzzles.length === 0" class="borderedContainer">
      <p class="instructions">No puzzles yet! Create a puzzle to get started.</p>
      <button class="createPuzzle" @click="openCreateDialog">Create Puzzle</button>
    </div>
  </section>
  <dialog class="createDialog" ref="create-dialog">
    <h3>New Puzzle</h3>
    <form @submit.prevent="sendCreatePuzzle">
      <label for="createPuzzle-name">Name:</label>
      <input type="text" id="createPuzzle-name" name="puzzleName" ref="create-name" />
      <button class="createPuzzle">Create</button>
    </form>
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

  .borderedContainer {
    border-width: 0 2px 0 2px;
    border-color: var(--color-border);
    border-style: solid;
    border-radius: 6px;
    padding: 4px;
  }

  .puzzleList {
    list-style-type: none;
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

  .createPuzzle {
    display: block;
    width: 100%;
    color: var(--color-interactable);
    font-weight: 600;
    background: none;
    margin: 0;
    padding: 4px;
    border: 3px solid var(--color-border);
    transition: color 0.4s, border-color 0.4s;
    cursor: pointer;
  }

  .create-puzzle:hover {
    color: var(--color-interactable-hover);
    border-color: var(--color-border-hover);
  }

  .createDialog {
    padding: 50px;
    border-radius: 6px;
    margin: auto;
  }
  .createDialog::backdrop {
    background-color: rgba(0, 0, 0, 0.3);
  }
</style>
