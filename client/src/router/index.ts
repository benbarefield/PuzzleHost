import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import UserHome from "@/views/UserHome.vue";
import Puzzle from "@/views/Puzzle.vue";

export const routeConfiguration : RouteRecordRaw[] = [
  {
    path: '/',
    name: 'user-home',
    component: UserHome
  },
  {
    path: '/puzzle/:id',
    name: 'puzzle-details',
    component: Puzzle,
    props: true,
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: routeConfiguration,
});

export default router
