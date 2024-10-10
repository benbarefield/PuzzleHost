<script lang="ts" setup>
  const answers = [{value: "A", answerIndex:0}, {value: "B", answerIndex: 2}, {value: "C", answerIndex: 1}]
  answers.sort((a, b) => a.answerIndex - b.answerIndex);
  const answerList = Array.from({length: answers.length * 2}, (_, i) => i % 2 === 0 ? answers[i / 2] : null);
</script>

<template>
  <section class="container">
    <h2 class="header">Puzzle Name ({{$route.params.id}})</h2>
    <ul class="answer-list">
      <li v-for="answer in answerList" class="answer">
        <p v-if="answer !== null">{{answer.value}}</p>
        <button v-if="answer === null">+</button>
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
