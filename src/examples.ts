import { createEvent, createDomain, createEffect } from 'effector';
import { Controller } from './types';
import { createRequestFx } from './create-request-fx';
import { createController } from './create-controller';

// Simple usage:

export const fetchCountryFx = createRequestFx(
  async (countryId: number, controller?: Controller): Promise<Response> =>
    fetch(`api/countries/${countryId}/`, {
      signal: await controller?.getSignal(),
    })
);

// You can provide custom cancel event:

export const cancelRequest = createEvent();
export const fetchCountryFx2 = createRequestFx({
  cancel: cancelRequest,
  handler: async (
    countryId: number,
    controller?: Controller
  ): Promise<Response> =>
    fetch(`api/countries/${countryId}/`, {
      signal: await controller?.getSignal(),
    }),
});

// Usage of request effect:

// The result of last request is taken
// There is only one request at a time
fetchCountryFx(1); // fetch cancelled!
fetchCountryFx(2); // fetch cancelled!
fetchCountryFx(3); // fetch ok

// And you can use it as a normal effect:

fetchCountryFx(1, { normal: true }); // fetch ok
fetchCountryFx(2, { normal: true }); // fetch ok
fetchCountryFx(3, { normal: true }); // fetch ok

// Initial cancel event doesn't work for normal events.
// Use your own controller for each normal request (optional):

const controller = createController();
fetchCountryFx(1, { normal: true, controller });
// Later in your code
controller.cancel();

// The handler is compartible with `createEffect`.
// There is a classic way to create normal effect:

const fetchCountry = async (
  countryId: number,
  controller?: Controller
): Promise<Response> =>
  fetch(`api/countries/${countryId}/`, {
    signal: await controller?.getSignal(),
  });

export const fetchCountryEffect = createRequestFx(fetchCountry);
export const fetchCountryFxNormal = createEffect(fetchCountry);

// You can provide your own domain to `createRequestFx` or `createController`:

export const app = createDomain();
export const fetchCountryFx3 = createRequestFx({
  domain: app,
  handler: async (
    countryId: number,
    controller?: Controller
  ): Promise<Response> =>
    fetch(`api/locations/countries/${countryId}/`, {
      signal: await controller?.getSignal(),
    }),
});

// ... or `createController`:

export const controller3 = createController({ domain: app });
fetchCountryFx3(1, { normal: true, controller: controller3 });
