import { step } from 'effector';

import { defaultDomain } from './domain';
import { Config, ConfigOrHandler, Options } from './types';

export const normalizeConfig = <Params, Result>(
  configOrHandler: ConfigOrHandler<Params, Result>
): Config<Params, Result> =>
  typeof configOrHandler === 'function'
    ? {
        handler: configOrHandler,
        cancel: undefined,
        domain: defaultDomain,
        name: undefined,
        sid: undefined,
      }
    : configOrHandler;

export const enableFxOptions = <T>(
  fx: T,
  optionsRef: { current?: Options }
): T => {
  /* eslint-disable no-param-reassign,@typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-return,@typescript-eslint/no-unsafe-member-access */
  // @ts-expect-error: internal .create
  const defaultCreate = fx.create;
  // @ts-expect-error: internal .create
  fx.create = (params, [options]) => defaultCreate([params, options]);

  // @ts-expect-error: internal .graphite
  fx.graphite.seq.unshift(
    step.compute({
      // @ts-expect-error: internal compute fn
      fn(upd, _, stack) {
        if (!stack.parent) {
          const {
            params: [params, options],
            req,
          } = upd;
          optionsRef.current = options;
          return { params, req };
        }

        return upd;
      },
    })
  );
  /* eslint-enable */

  return fx;
};
