import { attach, createEffect, createStore, sample } from 'effector';

import { Controller, ControllerConfig } from './types';

export const createController = (config?: ControllerConfig): Controller => {
  const { cancel } = config ?? {};
  const $controller = createStore(new AbortController());
  const getSignalFx = createEffect(
    (controller: AbortController) => controller.signal
  );
  const cancelFx = createEffect((controller: AbortController) =>
    controller.abort()
  );

  if (cancel) {
    sample({
      source: $controller,
      clock: cancel,
      target: cancelFx,
    });
  }

  $controller.on(cancelFx.done, () => new AbortController());

  return {
    getSignal: attach({
      source: $controller,
      effect: getSignalFx,
    }),
    cancel: attach({
      source: $controller,
      effect: cancelFx,
    }),
  };
};
