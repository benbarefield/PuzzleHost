import {afterAll, beforeEach, describe, expect, it, vi} from 'vitest'
import {flushPromises, mount, VueWrapper} from "@vue/test-utils";
import {createTestingPinia} from "@pinia/testing";
import {type Puzzle} from "../../stores/puzzles";
import UserHome from "@/views/UserHome.vue";
import {routeConfiguration} from "@/router";
import {nextTick} from "vue";
import {type Router, createRouter, createWebHistory} from "vue-router";

describe("UserHome view", () => {
  let wrapper: VueWrapper, router: Router;
  const puzzleData: Puzzle[] = [
    { name: "First", id: "1" },
    { name: "Two", id: "12" },
  ];

  interface PendingFetch {
    url: string,
    resolve: (r: Response) => void
    reject: (r: Response) => void
    options: RequestInit,
    completed: boolean,
  }

  interface MockResponseInit {
    body: BodyInit,
    options: ResponseInit,
  }
  interface FetchMockFunction extends Function {
    pending: PendingFetch[],
    resolveFetch: (urlPattern: RegExp, r: MockResponseInit) => void
    getRequest: (urlPattern: RegExp, index?: number) => Request;
  }

  let originalFetch = global.fetch, fetchMock: FetchMockFunction;

  function doFetchMocking() : FetchMockFunction {
    const mock: FetchMockFunction = function(this: FetchMockFunction, resource: string | URL | Request, options : RequestInit | undefined) {
      // const { promise, resolve, reject } = Promise.withResolvers();
      let resolve : (r: Response) => void = r => {}, reject : (r: Response) => void = r => {};
      const promise: Promise<Response> = new Promise((v, j) => {
        resolve = v;
        reject = j;
      });

      this.pending.push({
        url: resource instanceof Request ? resource.url : resource.toString(),
        resolve,
        reject,
        completed: false,
        options: options || {},
      });

      return promise;
    };

    mock.pending = [];

    const resolveFetch = function(this: FetchMockFunction, urlPattern: RegExp, response: MockResponseInit): void {
      const toSend = new Response(response.body, response.options);
      for(let i = 0; i < this.pending.length; i++) {
        const pending = this.pending[i];
        if(pending.completed || !urlPattern.test(pending.url)) { continue; }

        pending.completed = true;
        pending.resolve(toSend);
        return;
      }
      // no match error?
    }
    mock.resolveFetch = resolveFetch.bind(mock);

    const getRequest = function(this: FetchMockFunction, urlPattern: RegExp, index: number = 0): Request {
      let count = 0;
      for(let i = 0; i < this.pending.length; i++) {
        const pending = this.pending[i];
        if(!urlPattern.test(pending.url)) { continue; }
        if(index != count++) { continue; }

        return new Request(pending.url, pending.options);
      }
      throw new Error(`No matching request for ${urlPattern} at index ${index}`);
    }
    mock.getRequest = getRequest.bind(mock);

    global.fetch = mock.bind(mock);
    return mock;
  }

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

  afterAll(() => {
    // should this should include a teardown of the mock?
    global.fetch = originalFetch;
  })

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

