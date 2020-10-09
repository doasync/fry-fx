import { allSettled, createDomain, createEvent, fork, is } from 'effector';

import { createController, createRequestFx } from '../src';

export const argumentHistory = (fn: jest.Mock): unknown[] =>
  fn.mock.calls.map(([argument]: [unknown]) => argument);
const sleep = async (ms: number) =>
  new Promise(resolve => setTimeout(resolve, ms));
const nextTick = async () => sleep(0);

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
