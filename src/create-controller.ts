import { attach, sample } from 'effector';

import { Controller, ControllerConfig } from './types';
import { defaultDomain } from './domain';

export const createController = (config?: ControllerConfig): Controller => {
  const { cancel, domain = defaultDomain } = config ?? {};

  const $controller = domain.createStore(new AbortController());
  const getSignalFx = domain.createEffect(
    (controller: AbortController) => controller.signal
  );
  const cancelFx = domain.createEffect((controller: AbortController) =>
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
