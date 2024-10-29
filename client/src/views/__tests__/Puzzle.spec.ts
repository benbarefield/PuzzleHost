import {beforeEach, describe, expect, it, vi} from 'vitest'
import {flushPromises, mount, VueWrapper} from "@vue/test-utils";
import {createTestingPinia} from "@pinia/testing";
import {type Puzzle} from "../../stores/puzzles";
import {type PuzzleAnswer} from '../../stores/puzzleAnswers'
import PuzzleView from "../Puzzle.vue"
import {routeConfiguration} from "../../router";
import {createRouter, createWebHistory, type Router} from "vue-router";
import doFetchMocking, {type FetchMockFunction} from "@/testUtil/fetchMocker";

describe("Puzzle view", () => {
  let wrapper: VueWrapper, router: Router, fetchMock: FetchMockFunction;
  const puzzleData: Puzzle = {name: "First", id: "1"};
  const answers: PuzzleAnswer[] = [
    {
      puzzle: puzzleData.id,
      value: "b",
      answerIndex: 0,
      id: "1",
    },
    {
      puzzle: puzzleData.id,
      value: "n",
      answerIndex: 2,
      id: "2",
    },
    {
      puzzle: puzzleData.id,
      value: "e",
      answerIndex: 1,
      id: "3",
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
  });

  describe("when the puzzle exists in the store but answers do not", () => {
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
              },
            }),
          ],
        }
      });
    });

    it('should show the puzzle name', () => {
      expect(wrapper.find("[data-test='puzzle-name']").text()).toBe(puzzleData.name);
    });

    it('should not request the puzzle data', () => {
      expect(fetchMock.numberOfRequestsTo(/api\/puzzle(?!A)/)).toBe(0);
    });

    it('should retrieve the answers and display them', async () => {
      expect(wrapper.find(`[data-test="answers-loading"]`).exists()).toBe(true);

      fetchMock.resolveFetchWithJson(new RegExp(`/api/puzzleAnswer/\\?puzzle=${puzzleData.id}`), JSON.stringify(answers));

      await flushPromises();

      expect(wrapper.find(`[data-test="answers-loading"]`).exists()).toBe(false);
      const answerElements = wrapper.findAll('.answer');
      expect(answerElements.length).toBe(answers.length);
      for(let i = 0; i < answers.length; ++i) {
        expect(answerElements[answers[i].answerIndex].text()).toContain(answers[i].value);
      }
    });

    it('should have an add button when there are no answers', async() => {
      fetchMock.resolveFetchWithJson(new RegExp(`/api/puzzleAnswer/\\?puzzle=${puzzleData.id}`), JSON.stringify([]));

      await flushPromises();

      expect(wrapper.find(`[data-test="answers-loading"]`).exists()).toBe(false);
      expect(wrapper.find(".answerList button").exists()).toBe(true);
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

    it('should not request answer data until puzzle data exists', async () => {
      expect(fetchMock.numberOfRequestsTo(/api\/puzzleAnswer/)).toBe(0);

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

      expect(fetchMock.numberOfRequestsTo(new RegExp(`/api/puzzleAnswer/\\?puzzle=${puzzleData.id}`))).toBe(1);
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
      expect(wrapper.find('[data-test="puzzle-name"]').text()).toContain(puzzleData.name);
    });
  });

  describe('when the puzzle and the answers exist in the store', () => {
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
        expect(answerElements[answers[i].answerIndex].text()).toContain(answers[i].value);
      }
    });

    describe('when deleting an answer', () => {
      it('should be removed from the list and list order updated', async () => {
        const deletes = wrapper.findAll('button[data-test="delete"]');

        await deletes[1].trigger('click');

        const answerElements = wrapper.findAll('.answer');
        expect(answerElements.length).toBe(answers.length - 1);
      });

      it('should update answer indexes properly for deleted elements', async () => {
        const deletes = wrapper.findAll('button[data-test="delete"]');
        await deletes[0].trigger('click');
        // kind of annoying that this needs to happen due to async action in pinia
        fetchMock.resolveFetch(/api\/puzzleAnswer/, { body : null, options: { status: 204 }});

        const adds = wrapper.findAll('button[data-test="add"]');
        await adds[adds.length-1].trigger('click');

        const newAnswerValue = "abcd";
        await wrapper.find(".newAnswerDialog input").setValue(newAnswerValue);
        await wrapper.find(".newAnswerDialog button").trigger('click');

        fetchMock.resolveFetchWithText(/api\/puzzleAnswer/, "9");
        await flushPromises();

        const answerElements = wrapper.findAll('.answer');
        expect(answerElements[answerElements.length-1].text()).toContain(newAnswerValue);
      });

      it('should be added back to the list if the delete fails', async () => {
        const deletes = wrapper.findAll('button[data-test="delete"]');
        await deletes[0].trigger('click');

        const requestPattern = new RegExp(`/api/puzzleAnswer/${answers[0].id}$`);
        expect(fetchMock.numberOfRequestsTo(requestPattern)).toBe(1);
        expect(fetchMock.getRequest(requestPattern).method).toBe("DELETE");

        fetchMock.resolveFetch(requestPattern, {
          body: "",
          options: {
            status: 500
          },
        });

        await flushPromises();

        const answerElements = wrapper.findAll('.answer');
        expect(answerElements.length).toBe(answers.length);
        for(let i = 0; i < answers.length; ++i) {
          expect(answerElements[answers[i].answerIndex].text()).toContain(answers[i].value);
        }
      });
      // and answer indexes are fixed after delete failed

      it('should be possible to remove a recently added answer', async () => {
        const addButtons = wrapper.findAll('[data-test="add"]');
        await addButtons[addButtons.length-1].trigger('click');

        const newAnswerValue = "abcd";
        await wrapper.find(".newAnswerDialog input").setValue(newAnswerValue);
        await wrapper.find(".newAnswerDialog button").trigger('click');

        const id = "9";
        fetchMock.resolveFetchWithText(/api\/puzzleAnswer/, id);
        await flushPromises();

        const deletes = wrapper.findAll('button[data-test="delete"]');
        await deletes[deletes.length - 1].trigger('click');

        const request = fetchMock.getRequest(new RegExp(`/api/puzzleAnswer/${id}$`));
        expect(request.method).toBe("DELETE");
      });
    });
  });

  describe('when adding new answers', () => {
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

    it('should be possible to add one to the end of the list', async () => {
      const addButtons = wrapper.findAll('[data-test="add"]');

      const toPress = addButtons[addButtons.length-1];
      await toPress.trigger('click');

      const newAnswerValue = "abcd";
      await wrapper.find(".newAnswerDialog input").setValue(newAnswerValue);
      await wrapper.find(".newAnswerDialog button").trigger('click');

      fetchMock.resolveFetchWithText(/api\/puzzleAnswer/, "9");
      await flushPromises();

      const answerElements = wrapper.findAll('.answer');
      expect(answerElements.length).toBe(answers.length + 1);
      expect(answerElements[answerElements.length-1].text()).toContain(newAnswerValue);
    });

    it('should be possible to add one at the top of the list', async () => {
      const addButtons = wrapper.findAll('[data-test="add"]');

      const toPress = addButtons[0];
      await toPress.trigger('click');

      const newAnswerValue = "abcd";
      await wrapper.find(".newAnswerDialog input").setValue(newAnswerValue);
      await wrapper.find(".newAnswerDialog button").trigger('click');

      fetchMock.resolveFetchWithText(/api\/puzzleAnswer/, "9");
      await flushPromises();

      const answerElements = wrapper.findAll('.answer');
      expect(answerElements.length).toBe(answers.length + 1);
      expect(answerElements[0].text()).toContain(newAnswerValue);
      for(let i = 0; i < answers.length; ++i) {
        expect(answerElements[answers[i].answerIndex+1].text()).toContain(answers[i].value);
      }
    });

    it('should be possible to add one in the middle of the list', async () => {
      const addButtons = wrapper.findAll('[data-test="add"]');

      const toPress = addButtons[1];
      await toPress.trigger('click');

      const newAnswerValue = "abcd";
      await wrapper.find(".newAnswerDialog input").setValue(newAnswerValue);
      await wrapper.find(".newAnswerDialog button").trigger('click');

      fetchMock.resolveFetchWithText(/api\/puzzleAnswer/, "9");
      await flushPromises();

      const answerElements = wrapper.findAll('.answer');
      expect(answerElements.length).toBe(answers.length + 1);
      const originalFirst = answers.find(a => a.answerIndex === 0) || answers[0];
      expect(answerElements[0].text()).toContain(originalFirst.value);
      expect(answerElements[1].text()).toContain(newAnswerValue);
      for(let i = 0; i < answers.length; ++i) {
        if(answers[i] === originalFirst) { continue; }
        expect(answerElements[answers[i].answerIndex+1].text()).toContain(answers[i].value);
      }
    });

    it("should not add until the successful result from the server", async () => {
      const addButtons = wrapper.findAll('[data-test="add"]');

      const toPress = addButtons[0];
      await toPress.trigger('click');

      const newAnswerValue = "abcd";
      await wrapper.find(".newAnswerDialog input").setValue(newAnswerValue);
      await wrapper.find(".newAnswerDialog button").trigger('click');

      let answerElements = wrapper.findAll('.answer');
      expect(answerElements.length).toBe(answers.length);

      const request = fetchMock.getRequest(/api\/puzzleAnswer/);
      expect(request.method).toBe("POST");
      expect(request.headers.get("Content-Type")).toContain("application/json");
      const data = await request.json();
      expect(data).toEqual({
        value: newAnswerValue,
        answerIndex: 0,
        puzzle: puzzleData.id,
      });

      fetchMock.resolveFetchWithText(/api\/puzzleAnswer/, "9");
      await flushPromises();

      answerElements = wrapper.findAll('.answer');
      expect(answerElements.length).toBe(answers.length + 1);
    });
  });
});
