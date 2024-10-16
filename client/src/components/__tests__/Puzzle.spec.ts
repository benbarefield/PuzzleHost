import {beforeEach, describe, expect, it, vi} from 'vitest'
import {flushPromises, mount, VueWrapper} from "@vue/test-utils";
import {createTestingPinia} from "@pinia/testing";
import {type Puzzle} from "@/stores/puzzles";
import {type PuzzleAnswer} from '@/stores/puzzleAnswers'
import PuzzleView from "@/views/Puzzle.vue"
import {routeConfiguration} from "@/router";
import {type Router, createRouter, createWebHistory} from "vue-router";
import doFetchMocking, {type FetchMockFunction} from "./fetchMocker";
import { wrap } from 'module';

describe("UserHome view", () => {
  let wrapper: VueWrapper, router: Router, fetchMock: FetchMockFunction;
  const puzzleData: Puzzle = {name: "First", id: "1"};
  const answers: PuzzleAnswer[] = [
    {
      id: "1",
      puzzle: puzzleData.id,
      value: "b",
      answerIndex: 0
    },
    {
      id: "2",
      puzzle: puzzleData.id,
      value: "n",
      answerIndex: 2
    },
    {
      id: "3",
      puzzle: puzzleData.id,
      value: "e",
      answerIndex: 1
    },
  ];

  beforeEach(async () => {
    fetchMock = doFetchMocking();

    router = createRouter({
      history: createWebHistory(),
      routes: routeConfiguration,
    });
    router.push(`/puzzle/${puzzleData.id}`);
    await router.isReady();

    wrapper = mount(PuzzleView, {
      props: {
        id: puzzleData.id,
      },
      global: {
        plugins: [
          router,
          createTestingPinia({
            stubActions: false,
            createSpy: vi.fn,
            initialState: {
              puzzles: {
                puzzles: [puzzleData],
              },
            },
          }),
        ],
      }
    });
  });

  describe("when the puzzle exists in the store", () => {
    it('should show the puzzle name', () => {
      expect(wrapper.find("[data-test='puzzle-name']").text()).toBe(puzzleData.name);
    });

    it('should not request the puzzle data', () => {
      expect(fetchMock.numberOfRequestsTo(/api\/puzzle/)).toBe(0);
    });
  });

  describe("when the puzzle does not exist in the store", () => {
    beforeEach(() => {
      wrapper = mount(PuzzleView, {
        props: {
          id: puzzleData.id,
        },
        global: {
          plugins: [
            router,
            createTestingPinia({
              stubActions: false,
              createSpy: vi.fn,
              initialState: {
              },
            }),
          ],
        }
      });
    });

    it('should first request the puzzle data and then display', async () => {
      expect(wrapper.find('[data-test="puzzle-loading"]').exists()).toBe(true);
      expect(wrapper.find('[data-test="puzzle-name"]').exists()).toBe(false);

      fetchMock.resolveFetch(new RegExp(`api/puzzle/${puzzleData.id}`), {
        body: JSON.stringify(puzzleData),
        options: {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        },
      });

      await flushPromises();

      expect(wrapper.find('[data-test="puzzle-loading"]').exists()).toBe(false);
      expect(wrapper.find('[data-test="puzzle-name"]').text()).toBe(puzzleData.name);
    });
  });

  describe('when answers have not yet been retrieved', () => {
    it('should show the loading indicator', () => {
      expect(wrapper.find('[data-test="answers-loading"]').exists()).toBe(true);
    });
  });

  describe('when answers exist in the store', () => {
    beforeEach(() => {
      wrapper = mount(PuzzleView, {
        props: {
          id: puzzleData.id,
        },
        global: {
          plugins: [
            router,
            createTestingPinia({
              stubActions: false,
              createSpy: vi.fn,
              initialState: {
                puzzles: {
                  puzzles: [puzzleData],
                },
                puzzleAnswers: {
                  answers: {
                    [puzzleData.id]: answers,
                  },
                },
              },
            }),
          ],
        }
      });
    });

    it('should show the answers in the correct order', () => {
      const answerElements = wrapper.findAll('.answer');
      expect(answerElements.length).toBe(answers.length);
      for(let i = 0; i < answers.length; ++i) {
        expect(answerElements[answers[i].answerIndex].text()).toBe(answers[i].value);
      }
    });
  });
});
