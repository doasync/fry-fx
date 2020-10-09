import { sample } from 'effector';

import { defaultDomain } from './domain';
import { Controller, ControllerConfig, Subscription } from './types';

export const createController = (config?: ControllerConfig): Controller => {
  const { cancel: userCancel, domain = defaultDomain } = config ?? {};

  const cancel = domain.createEvent();

  const onCancel = (fn: () => void): Subscription => {
    return cancel.watch(() => fn());
  };

  const $controller = domain
    .createStore(new AbortController())
    .on(cancel, controller => {
      controller.abort();
      return new AbortController();
    });

  if (userCancel) {
    sample({
      source: $controller,
      clock: userCancel,
      fn: () => {},
      target: cancel,
    });
  }

  return {
    getSignal: () => $controller.getState().signal,
    cancel,
    onCancel,
  };
};
