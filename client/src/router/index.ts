import { createRouter, createWebHistory } from 'vue-router'
import UserHome from "@/views/UserHome.vue";
import Puzzle from "@/views/Puzzle.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'user-home',
      component: UserHome
    },
    {
      path: '/puzzle/:id',
      name: 'puzzle-details',
      component: Puzzle,
    },
  ],
});

export default router
