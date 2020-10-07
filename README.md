[![NPM Version][npm-image]][npm-url] ![NPM Downloads][downloads-image] [![GitHub issues][issues-image]][issues-url]

[npm-image]: https://img.shields.io/npm/v/fry-fx.svg
[npm-url]: https://www.npmjs.com/package/fry-fx
[downloads-image]: https://img.shields.io/npm/dw/fry-fx.svg
[deps-image]: https://david-dm.org/doasync/fry-fx.svg
[issues-image]: https://img.shields.io/github/issues/doasync/fry-fx.svg
[issues-url]: https://github.com/doasync/fry-fx/issues

# Cancellable fetch requests ☄️✨

This lib makes it possible to create self-cancellable request
[effects](https://effector.now.sh/docs/api/effector/effect). It needs [effector](https://effector.now.sh) peer-dependency.

When you trigger an effect, all previous pending fetch requests are cancelled
(effects are rejected with AbortError).

In examples `request` is a `fetch` on steroids from
[fry](https://www.npmjs.com/package/fry) package

> `fry-fx` is written in TypeScript

---

## Installation

```bash
npm install fry-fx
```

or

```bash
yarn add fry-fx
```

## Usage

Simple usage:

```ts
export const fetchCountryFx = createRequestFx(
  async (countryId: number, controller?: Controller): Promise<Country> =>
    request({
      url: `api/countries/${countryId}/`,
      signal: await controller?.getSignal(),
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
      signal: await controller?.getSignal(),
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

Initial cancel event doesn't work for normal events. Use your own cancel event
to each normal request:

```ts
fetchCountryFx(1, { normal: true, cancel: cancelRequest });
```

The handler is compartible with `createEffect`. This is a classic way to create
normal effect:

```ts
const fetchCountry = async (
  countryId: number,
  controller?: Controller
): Promise<Country> =>
  request({
    url: `api/countries/${countryId}/`,
    signal: await controller?.getSignal(),
  });

export const fetchCountryFx = createRequestFx(fetchCountry);
export const fetchCountryFxNormal = createEffect(fetchCountry);
```

### Repository

---

GitHub ★: https://github.com/doasync/fry-fx
