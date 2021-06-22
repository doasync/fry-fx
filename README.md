[![NPM Version][npm-image]][npm-url] ![NPM Downloads][downloads-image] [![GitHub issues][issues-image]][issues-url]

[npm-image]: https://img.shields.io/npm/v/fry-fx.svg
[npm-url]: https://www.npmjs.com/package/fry-fx
[downloads-image]: https://img.shields.io/npm/dw/fry-fx.svg
[deps-image]: https://david-dm.org/doasync/fry-fx.svg
[issues-image]: https://img.shields.io/github/issues/doasync/fry-fx.svg
[issues-url]: https://github.com/doasync/fry-fx/issues

# Cancellable fetch requests ☄️✨

This lib makes it possible to create self-cancellable request
[effects](https://effector.now.sh/docs/api/effector/effect). It needs
[effector](https://effector.now.sh) as a peer-dependency.

When you trigger an effect, all previous pending fetch requests are cancelled
(effects are rejected with AbortError).

In examples `request` is a `fetch` on steroids from
[fry](https://www.npmjs.com/package/fry) package

> `fry-fx` is written in TypeScript

---

## Installation

```bash
npm install effector fry-fx
```

or

```bash
yarn add effector fry-fx
```

## Exports

```ts
export { createRequestFx } from './create-request-fx';
export { createController } from './create-controller';
```

## Usage

Simple usage:

```ts
export const fetchCountryFx = createRequestFx(
  async (countryId: number, controller?: Controller): Promise<Country> =>
    request({
      url: `api/countries/${countryId}/`,
      signal: controller?.getSignal(),
    })
);
```

You can provide custom cancel event to cancel request manually:

```ts
export const cancelRequest = createEvent();
export const fetchCountryFx = createRequestFx({
  cancel: cancelRequest,
  handler: async (
    countryId: number,
    controller?: Controller
  ): Promise<Country> =>
    request({
      url: `api/countries/${countryId}/`,
      signal: controller?.getSignal(),
    }),
});
```

Usage of request effect:

```ts
// The result of last request is taken
// There is only one request at a time
fetchCountryFx(1); // fetch cancelled!
fetchCountryFx(2); // fetch cancelled!
fetchCountryFx(3); // fetch ok
```

And you can use it as a normal effect (classic behavior):

```ts
// Fetches in parallel
// There are three requests at a time
fetchCountryFx(1, { normal: true }); // fetch ok
fetchCountryFx(2, { normal: true }); // fetch ok
fetchCountryFx(3, { normal: true }); // fetch ok
```

Initial cancel event doesn't work for normal events. Use your own controller for each normal request (optional):

```ts
const controller = createController();
fetchCountryFx(1, { normal: true, controller });
// Later in your code
controller.cancel();
```

The handler is compatible with `createEffect`. There is a classic way to create normal effect:

```ts
const fetchCountry = async (
  countryId: number,
  controller?: Controller
): Promise<Country> =>
  request({
    url: `api/countries/${countryId}/`,
    signal: controller?.getSignal(),
  });

export const fetchCountryFx = createRequestFx(fetchCountry);
export const fetchCountryFxNormal = createEffect(fetchCountry);
```

You can provide your own domain to `createRequestFx` or `createController`:

```ts
export const app = createDomain();
export const fetchCountryFx = createRequestFx({
  domain: app,
  handler: async (
    countryId: number,
    controller?: Controller
  ): Promise<Country> =>
    request({
      url: `api/countries/${countryId}/`,
      signal: controller?.getSignal(),
    }),
});

// ... or `createController`:
export const controller = createController({ domain: app });
fetchCountryFx(1, { normal: true, controller });
```

You can do a cleanup, use .onCancel method of your controller:

```ts
const fx = createRequestFx(async (params: number, controller) => {
  let timeout: number;

  return new Promise((resolve, reject) => {
    void controller?.onCancel(() => {
      clearTimeout(timeout);
      reject(new Error('Cancelled'));
    });
    timeout = setTimeout(() => {
      console.log(`Not cancelled: ${params}`);
      resolve(`Result: ${params}`);
    });
  });
});

fx(1); // No logs, effect fails with "Cancelled" error
fx(2); // No logs, effect fails with "Cancelled" error
fx(3); // Logs "Not cancelled: 3", effect is done with "Result: 3"
```

The library modifies internal `.create` method in order to pass options as a second argument to an effect. You can
disable this behavior and return unmodified effect by using `disableFxOptions` config option:

```ts
export const app = createDomain();
export const fetchCountryFx = createRequestFx({
  disableFxOptions: true,
  handler: async (
    countryId: number,
    controller?: Controller
  ): Promise<Country> =>
    request({
      url: `api/countries/${countryId}/`,
      signal: controller?.getSignal(),
    }),
});

// The sacond argument is disabled and ignored
fetchCountryFx(1 /*, { normal: true } */);
```

### Types

<details>
<summary>
  All
</summary>

```ts
export type Subscription = {
  unsubscribe: () => void;
  (): void;
};

export interface Controller {
  getSignal: () => AbortSignal;
  cancel: Event<void>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onCancel: (fn: () => any) => Subscription;
}

export interface ControllerConfig {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cancel?: Unit<any>;
  domain?: Domain;
}

export type Handler<Params, Result> = (
  params: Params,
  controller?: Controller
) => Promise<Result> | Result;

export interface Config<Params, Result> {
  handler: Handler<Params, Result>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cancel?: Unit<any>;
  domain?: Domain;
  name?: string;
  sid?: string;
  disableFxOptions?: boolean;
}

export interface ConfigType<FN> {
  handler: FN;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cancel?: Unit<any>;
  domain?: Domain;
  name?: string;
  sid?: string;
  disableFxOptions?: boolean;
}

export type ConfigOrHandler<Params, Result> =
  | Handler<Params, Result>
  | Config<Params, Result>;

export type Options = {
  normal?: boolean;
  controller?: Controller;
};

export interface RequestEffect<Params, Done, Fail = Error>
  extends Effect<Params, Done, Fail> {
  (payload: Params, options?: Options): Promise<Done>;
}

export declare const createController: (
  config?: ControllerConfig | undefined
) => Controller;

export declare function createRequestFx<
  Params = void,
  Done = unknown,
  Fail = Error
>(handler: Handler<Params, Done>): RequestEffect<Params, Done, Fail>;

export declare function createRequestFx<Params, Done, Fail = Error>(
  config: Config<Params, Done>
): RequestEffect<Params, Done, Fail>;
```

</details>

### Tests

<details>
<summary>
  All
</summary>

```ts
describe('createRequestFx', () => {
  it('accepts handler', async () => {
    const fx = createRequestFx(async () => Promise.resolve('data'));
    const result = await fx();

    expect(result).toEqual('data');
  });

  it('accepts config', async () => {
    const fx = createRequestFx({
      handler: async () => Promise.resolve('data'),
    });

    const result = await fx();

    expect(result).toEqual('data');
  });

  it('accepts cancel unit', () => {
    let signal: AbortSignal | undefined;
    const cancel = createEvent();
    const fx = createRequestFx({
      cancel,
      handler: (_: void, controller) => {
        signal = controller?.getSignal();
      },
    });

    void fx();
    cancel();

    expect(signal?.aborted).toBe(true);
  });

  it('accepts domain', () => {
    const domain = createDomain();
    const fx = createRequestFx({
      domain,
      handler: async () => Promise.resolve(),
    });

    expect(domain.history.effects.has(fx)).toBe(true);
  });

  it('returns effect', async () => {
    const doneData = jest.fn();
    const pending = jest.fn();

    const fx = createRequestFx(async () => Promise.resolve('data'));
    fx.doneData.watch(doneData);
    fx.pending.watch(pending);

    const result = await fx();

    expect(is.effect(fx)).toEqual(true);
    expect(result).toEqual('data');
    expect(argumentHistory(doneData)).toEqual(['data']);
    expect(argumentHistory(pending)).toEqual([false, true, false]);
  });
});

describe('effect', () => {
  it('cancels previous effects', () => {
    const signals: AbortSignal[] = [];
    const fx = createRequestFx((_: void, controller) => {
      const signal = controller?.getSignal();
      if (signal) signals.push(signal);
    });

    void fx();
    void fx();
    void fx();

    expect(signals.map(signal => signal.aborted)).toEqual([true, true, false]);
  });

  it('supports normal runs', async () => {
    const doneParams = jest.fn();
    const fail = jest.fn();
    const signals: Array<AbortSignal | undefined> = [];

    const fx = createRequestFx((_params: number, controller) => {
      const signal = controller?.getSignal();
      signals.push(signal);
    });

    fx.done.watch(({ params }) => {
      doneParams(params);
    });
    fx.fail.watch(fail);

    void fx(0, { normal: true });
    void fx(1);
    void fx(2);
    void fx(3);
    void fx(0, { normal: true });

    expect(signals.map(signal => signal?.aborted)).toEqual([
      undefined,
      true,
      true,
      false,
      undefined,
    ]);

    await nextTick();

    expect(argumentHistory(doneParams)).toEqual([0, 1, 2, 3, 0]);
    expect(argumentHistory(fail)).toEqual([]);
  });

  it('supports normal runs in separate ticks', async () => {
    const doneParams = jest.fn();
    const fail = jest.fn();
    const signals: Array<AbortSignal | undefined> = [];

    const fx = createRequestFx((_params: number, controller) => {
      const signal = controller?.getSignal();
      signals.push(signal);
    });

    fx.done.watch(({ params }) => {
      doneParams(params);
    });
    fx.fail.watch(fail);

    void fx(0, { normal: true });
    await nextTick();
    void fx(1);
    await nextTick();
    void fx(2);
    await nextTick();
    void fx(3);
    await nextTick();
    void fx(0, { normal: true });

    expect(signals.map(signal => signal?.aborted)).toEqual([
      undefined,
      true,
      true,
      false,
      undefined,
    ]);

    await nextTick();

    expect(argumentHistory(doneParams)).toEqual([0, 1, 2, 3, 0]);
    expect(argumentHistory(fail)).toEqual([]);
  });

  it('supports controller for normal runs', async () => {
    const done = jest.fn();
    const fail = jest.fn();
    const signals: Array<AbortSignal | undefined> = [];

    const fx = createRequestFx((params: number, controller) => {
      const signal = controller?.getSignal();
      signals.push(signal);
      return `-> ${params}`;
    });

    fx.done.watch(done);
    fx.fail.watch(fail);

    const controller = createController();

    void fx(0, { normal: true, controller });
    void fx(1);
    void fx(0, { normal: true });
    void fx(2);
    void fx(0, { normal: true, controller });
    void fx(3);

    await nextTick();

    void controller.cancel();

    expect(signals.map(signal => signal?.aborted)).toEqual([
      true,
      true,
      undefined,
      true,
      true,
      false,
    ]);

    expect(argumentHistory(done)).toEqual([
      {
        params: 0,
        result: '-> 0',
      },
      {
        params: 1,
        result: '-> 1',
      },
      {
        params: 0,
        result: '-> 0',
      },
      {
        params: 2,
        result: '-> 2',
      },
      {
        params: 0,
        result: '-> 0',
      },
      {
        params: 3,
        result: '-> 3',
      },
    ]);
    expect(argumentHistory(fail)).toEqual([]);
  });

  it('supports controller for individual effects', () => {
    const signals: Array<AbortSignal | undefined> = [];
    const fx = createRequestFx((_params: number, controller) => {
      const signal = controller?.getSignal();
      signals.push(signal);
    });

    const controller = createController();
    const controller2 = createController();

    void fx(0, { controller });
    void fx(1);
    void fx(0, { controller: controller2 });
    void fx(2);
    void fx(0, { controller });

    void controller.cancel();

    expect(signals.map(signal => signal?.aborted)).toEqual([
      true,
      true,
      true, // Cancelled anyway
      true,
      true,
    ]);
  });

  it('supports disableFxOptions', async () => {
    const doneParams = jest.fn();
    const fail = jest.fn();
    const signals: Array<AbortSignal | undefined> = [];

    const fx = createRequestFx({
      disableFxOptions: true,
      handler: (_params: number, controller) => {
        const signal = controller?.getSignal();
        signals.push(signal);
      },
    });

    fx.done.watch(({ params }) => {
      doneParams(params);
    });
    fx.fail.watch(fail);

    void fx(0, { normal: true }); // Options are ignored
    void fx(1);
    void fx(2);
    void fx(3);
    void fx(0, { normal: true }); // Options are ignored

    expect(signals.map(signal => signal?.aborted)).toEqual([
      true,
      true,
      true,
      true,
      false,
    ]);

    await nextTick();

    expect(argumentHistory(doneParams)).toEqual([0, 1, 2, 3, 0]);
    expect(argumentHistory(fail)).toEqual([]);
  });

  it('supports onCancel on controller', async () => {
    const done = jest.fn();
    const fail = jest.fn();
    const logs: string[] = [];

    const fx = createRequestFx(async (params: number, controller) => {
      let timeout: number;

      return new Promise((resolve, reject) => {
        void controller?.onCancel(() => {
          clearTimeout(timeout);
          reject(new Error('cancelled'));
        });
        timeout = setTimeout(() => {
          logs.push(`Not cancelled: ${params}`);
          resolve(`Result: ${params}`);
        });
      });
    });

    fx.done.watch(done);
    fx.fail.watch(fail);

    void fx(1);
    void fx(2);
    void fx(3);

    await nextTick();

    expect(logs).toMatchInlineSnapshot(`
      Array [
        "Not cancelled: 3",
      ]
    `);

    expect(argumentHistory(done)).toMatchInlineSnapshot(`
      Array [
        Object {
          "params": 3,
          "result": "Result: 3",
        },
      ]
    `);
    expect(argumentHistory(fail)).toMatchInlineSnapshot(`
      Array [
        Object {
          "error": [Error: cancelled],
          "params": 1,
        },
        Object {
          "error": [Error: cancelled],
          "params": 2,
        },
      ]
    `);
  });
});

describe('forked scope', () => {
  it('works', async () => {
    const app = createDomain();
    const fx = createRequestFx<string, string>(async (params: string) =>
      Promise.resolve(`data: ${params}`)
    );
    const $store = app.createStore('').on(fx.doneData, (_, payload) => payload);
    const scope = fork(app);
    await Promise.all([
      allSettled(fx, { scope, params: '1' }),
      allSettled(fx, { scope, params: '2' }),
      allSettled(fx, { scope, params: '3' }),
    ]);
    expect(scope.getState($store)).toEqual('data: 3');
  });
});
```

</details>

### Repository

---

GitHub ★: https://github.com/doasync/fry-fx
