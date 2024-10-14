import {beforeEach, describe, expect, it, vi} from 'vitest'
import {flushPromises, mount, VueWrapper} from "@vue/test-utils";
import {createTestingPinia} from "@pinia/testing";
import {type Puzzle} from "../../stores/puzzles";
import UserHome from "@/views/UserHome.vue";
import {routeConfiguration} from "@/router";
import {type Router, createRouter, createWebHistory} from "vue-router";
import doFetchMocking, {type FetchMockFunction} from "./fetchMocker";

describe("UserHome view", () => {
  let wrapper: VueWrapper, router: Router, fetchMock: FetchMockFunction;
  const puzzleData: Puzzle[] = [
    { name: "First", id: "1" },
    { name: "Two", id: "12" },
  ];

  beforeEach(async() => {
    fetchMock = doFetchMocking();

    router = createRouter({
      history: createWebHistory(),
      routes: routeConfiguration,
    });
    router.push("/");
    await router.isReady();

    wrapper = mount(UserHome, {
      global: {
        plugins: [
          router,
          createTestingPinia({
            stubActions: false,
            createSpy: vi.fn,
          }),
        ],
      }
    });
  });

  describe("when there are no puzzles in the store", async () => {
    it('should show a loading element', () => {
      expect(wrapper.find('.loading').exists()).toBe(true);
    });

    it('should retrieve the puzzles', async () => {
      fetchMock.resolveFetch(/api\/userPuzzles/, {
        body: JSON.stringify(puzzleData),
        options: {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        },
      });

      await flushPromises();

      expect(wrapper.find('.loading').exists()).toBe(false);
      const puzzles = wrapper.findAll(".puzzle");
      expect(puzzles.length).toBe(2);
      expect(puzzles[0].text()).toBe(puzzleData[0].name);
      expect(puzzles[1].text()).toBe(puzzleData[1].name);
    });

    it('should remove the loading indicator if there are no puzzles', async () => {
      fetchMock.resolveFetch(/api\/userPuzzles/, {
        body: "[]",
        options: {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        },
      });

      await flushPromises();

      expect(wrapper.find('.loading').exists()).toBe(false);
      expect(wrapper.find('.instructions').exists()).toBe(true);
    });
  });

  describe('when there are puzzles in the store', () => {
    beforeEach(() => {
      wrapper = mount(UserHome, {
        global: {
          plugins: [
            router,
            createTestingPinia({
              stubActions: false,
              createSpy: vi.fn,
              initialState: {
                puzzles: {
                  puzzles: puzzleData,
                  loaded: true,
                },
              },
            }),
          ],
        },
      });
    });

    it('should not show the loading', () => {
      expect(wrapper.find('.loading').exists()).toBe(false);
    });

    it('should show the puzzles', () => {
      const puzzles = wrapper.findAll(".puzzle");
      expect(puzzles.length).toBe(2);
      expect(puzzles[0].text()).toBe(puzzleData[0].name);
      expect(puzzles[1].text()).toBe(puzzleData[1].name);
    });

    it('should be possible to navigate to one puzzle details', async () => {
      await wrapper.findAll(".puzzle a")[0].trigger('click');

      await flushPromises();

      expect(router.currentRoute.value.fullPath.endsWith(`puzzle/${puzzleData[0].id}`)).toBe(true);
    });
  });

  describe('when creating a puzzle', () => {
    const newPuzzleName = "additional puzzle";

    beforeEach(async () => {
      fetchMock.resolveFetch(/api\/userPuzzles/, {
        body: JSON.stringify(puzzleData),
        options: {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        },
      });

      await flushPromises();

      await wrapper.find('#create-puzzleName').setValue(newPuzzleName);
      await wrapper.find('dialog .create-puzzle').trigger('submit');
    });

    // it('should be possible to open the dialog', async () => {
    //   await wrapper.find(".create-puzzle").trigger("click");
    //
    //   expect(wrapper.find("dialog[show]").exists()).toBe(true);
    // });

    it('should post the created puzzle', async () => {
      const req = fetchMock.getRequest(/api\/puzzle/);
      expect(req).toBeTruthy();
      const data = await req.json();
      expect(data.name).toBe(newPuzzleName);
      expect(req.method).toBe("POST");
      expect(req.headers.get("Content-Type")).toBe("application/json");
    });

    it('should show the created puzzle in the list', () => {
      const puzzles = wrapper.findAll(".puzzle");

      expect(puzzles.length).toBe(3);
      expect(puzzles[2].text()).toContain(newPuzzleName);
    });

    it('should not do anything when the created puzzle is clicked until a response with an id', () => {
      const puzzleLinks = wrapper.findAll(".puzzle a");

      expect(puzzleLinks.length).toBe(2);
    });

    it('should be possible to click the created puzzle after a response with an id', async () => {
      const puzzleId = "1234567";

      fetchMock.resolveFetch(/api\/puzzle/, {
        body: puzzleId,
        options: {
          status: 200,
        }
      });

      await flushPromises();

      const puzzleLinks = wrapper.findAll(".puzzle a");
      expect(puzzleLinks.length).toBe(3);
      await puzzleLinks[2].trigger('click');

      await flushPromises();

      expect(router.currentRoute.value.fullPath.endsWith(`puzzle/${puzzleId}`)).toBe(true);
    });

    // remove created on error
  });
});

