[![NPM Version][npm-image]][npm-url] ![NPM Downloads][downloads-image] [![GitHub issues][issues-image]][issues-url]

[npm-image]: https://img.shields.io/npm/v/fry-fx.svg
[npm-url]: https://www.npmjs.com/package/fry-fx
[downloads-image]: https://img.shields.io/npm/dw/fry-fx.svg
[deps-image]: https://david-dm.org/doasync/fry-fx.svg
[issues-image]: https://img.shields.io/github/issues/doasync/fry-fx.svg
[issues-url]: https://github.com/doasync/fry-fx/issues

# Cancellable fetch requests ☄️✨

This lib makes it possible to create self-cancellable request
[effects](https://effector.now.sh/docs/api/effector/effect). It needs [effector](https://effector.now.sh) as a peer-dependency.

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

You can provide custom cancel event:

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

And you can use it as a normal effect:

```ts
// Fetches in parallel
// There are three requests at a time
fetchCountryFx(1, { normal: true }); // fetch ok
fetchCountryFx(2, { normal: true }); // fetch ok
fetchCountryFx(3, { normal: true }); // fetch ok
```

Initial cancel event doesn't work for normal events. Use your own controller for
each normal request (optional):

```ts
const controller = createController();
fetchCountryFx(1, { normal: true, controller });
// Later in your code
controller.cancel();
```

The handler is compartible with `createEffect`. There is a classic way to create
normal effect:

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
      signal: await controller?.getSignal(),
    }),
});

// ... or `createController`:
export const controller = createController({ domain: app });
fetchCountryFx(1, { normal: true, controller });
```

// You can do a cleanup, use .onCancel method of your controller:

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

### Types

<details>
<summary>
  All
</summary>

```ts
import { Effect, Unit, Domain } from 'effector';

export interface Controller {
  getSignal: Effect<void, AbortSignal>;
  cancel: Effect<void, void>;
}

export interface ControllerConfig {
  cancel?: Unit<unknown>;
  domain?: Domain;
}

export type Handler<Params, Result> = (
  params: Params,
  controller?: Controller
) => Promise<Result>;

export interface Config<Params, Result> {
  handler: Handler<Params, Result>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cancel?: Unit<any>;
  domain?: Domain;
}

export type ConfigOrHandler<Params, Result> =
  | Handler<Params, Result>
  | Config<Params, Result>;

export type FxOptions = {
  normal?: boolean;
  controller?: Controller;
};

export interface RequestEffect<Params, Done, Fail = Error>
  extends Effect<Params, Done, Fail> {
  (payload: Params, options: FxOptions): Promise<Done>;
}

export type ParamsRef<Params> = { current: [Params, FxOptions?] };
```

</details>

### Repository

---

GitHub ★: https://github.com/doasync/fry-fx
