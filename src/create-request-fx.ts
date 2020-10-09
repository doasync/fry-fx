/* eslint-disable @typescript-eslint/no-explicit-any */
import { Domain, Unit } from 'effector';

import { createController } from './create-controller';
import { defaultDomain } from './domain';
import { ConfigOrHandler, Handler, Options, RequestEffect } from './types';
import { enableFxOptions, normalizeConfig } from './utils';

export function createRequestFx<FN extends Handler<unknown, unknown>>(
  handler: FN
): FN extends (...args: infer Arguments) => infer Done
  ? RequestEffect<
      Arguments['length'] extends 0
        ? void
        : 0 | 1 extends Arguments['length'] // Is the first argument optional?
        ? Arguments[0] | void
        : Arguments[0],
      Done extends Promise<infer Async> ? Async : Done
    >
  : never;

export function createRequestFx<Params = void, Done = unknown, Fail = Error>(
  handler: Handler<Params, Done>
): RequestEffect<Params, Done, Fail>;

// eslint-disable-next-line @typescript-eslint/unified-signatures
export function createRequestFx<FN extends Handler<unknown, unknown>>(config: {
  name?: string;
  handler: FN;
  cancel?: Unit<any>;
  domain?: Domain;
  sid?: string;
}): FN extends (...args: infer Arguments) => infer Done
  ? RequestEffect<
      Arguments['length'] extends 0
        ? void
        : 0 | 1 extends Arguments['length'] // Is the first argument optional?
        ? Arguments[0] | void
        : Arguments[0],
      Done extends Promise<infer Async> ? Async : Done
    >
  : never;

// eslint-disable-next-line @typescript-eslint/unified-signatures
export function createRequestFx<Params, Done, Fail = Error>(config: {
  name?: string;
  handler: Handler<Params, Done>;
  cancel?: Unit<any>;
  domain?: Domain;
  sid?: string;
}): RequestEffect<Params, Done, Fail>;

export function createRequestFx<Params = void, Done = unknown, Fail = Error>(
  configOrHandler: ConfigOrHandler<Params, Done>
): RequestEffect<Params, Done, Fail> {
  const {
    handler,
    cancel,
    domain = defaultDomain,
    name,
    sid,
  } = normalizeConfig<Params, Done>(configOrHandler);
  const controller = createController({ cancel, domain });
  const optionsRef: { current?: Options } = { current: undefined };

  const fx = domain.createEffect<Params, Done, Fail>({
    name,
    sid,
    handler: async (params: Params) => {
      const options = optionsRef.current;

      if (options?.normal) {
        return handler(params, options.controller);
      }

      void controller.cancel();

      if (options?.controller) {
        const optionsController = options.controller;
        controller.cancel.watch(() => {
          optionsController.cancel();
        });
        return handler(params, optionsController);
      }

      return handler(params, controller);
    },
  }) as RequestEffect<Params, Done, Fail>;

  return enableFxOptions(fx, optionsRef);
}
