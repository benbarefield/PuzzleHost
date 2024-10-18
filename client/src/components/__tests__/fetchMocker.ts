export interface MockResponseInit {
  body: BodyInit,
  options: ResponseInit,
}

export interface FetchMockFunction extends Function {
  (resource: string | URL | Request, options : RequestInit | undefined): Promise<Response>
  resolveFetch: (urlPattern: RegExp, r: MockResponseInit) => void
  resolveFetchWithJson: (urlPattern: RegExp, data: string) => void
  resolveFetchWithText: (urlPattern: RegExp, data: string) => void
  getRequest: (urlPattern: RegExp, index?: number) => Request;
  numberOfRequestsTo: (urlPattern: RegExp) => number;
}

interface PendingFetch {
  url: string,
  resolve: (r: Response) => void
  reject: (r: Response) => void
  options: RequestInit,
  completed: boolean,
}

export default function doFetchMocking() : FetchMockFunction {
  const requests: PendingFetch[] = [];

  const mock: FetchMockFunction = function(resource: string | URL | Request, options : RequestInit | undefined): Promise<Response> {
    // const { promise, resolve, reject } = Promise.withResolvers();
    let resolve : (r: Response) => void = r => {}, reject : (r: Response) => void = r => {};
    const promise: Promise<Response> = new Promise((v, j) => {
      resolve = v;
      reject = j;
    });

    requests.push({
      url: resource instanceof Request ? resource.url : resource.toString(),
      resolve,
      reject,
      completed: false,
      options: options || {},
    });

    return promise;
  };

  mock.resolveFetch = function(urlPattern: RegExp, response: MockResponseInit): void {
    const toSend = new Response(response.body, response.options);
    for(let i = 0; i < requests.length; i++) {
      const pending = requests[i];
      if(pending.completed || !urlPattern.test(pending.url)) { continue; }

      pending.completed = true;
      pending.resolve(toSend);
      return;
    }

    throw new Error(`No matching unresolved request for ${urlPattern}`);
  }

  mock.resolveFetchWithJson = function(urlPattern: RegExp, data: string): void {
    mock.resolveFetch(urlPattern, {
      body: data,
      options: {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      },
    });
  }

  mock.resolveFetchWithText = function(urlPattern: RegExp, data: string): void {
    mock.resolveFetch(urlPattern, {
      body: data,
      options: {
        status: 200,
        headers: {
          "Content-Type": "text/plain",
        },
      },
    });
  }

  mock.getRequest = function(urlPattern: RegExp, index: number = 0): Request {
    let count = 0;
    for(let i = 0; i < requests.length; i++) {
      const pending = requests[i];
      if(!urlPattern.test(pending.url)) { continue; }
      if(index != count++) { continue; }

      return new Request(pending.url, pending.options);
    }
    throw new Error(`No matching request for ${urlPattern} at index ${index}`);
  }

  mock.numberOfRequestsTo = function(urlPattern: RegExp): number {
    return requests.reduce((s, p) => urlPattern.test(p.url) ? s + 1 : s, 0);
  }

  global.fetch = mock;
  return mock;
}
