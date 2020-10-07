import { createController } from './create-controller';
import { ConfigOrHandler, ParamsRef, RequestEffect } from './types';
import { defaultDomain } from './domain';
import {
  enableFxOptions,
  isParamsRef,
  nextTick,
  normalizeConfig,
} from './utils';

export const createRequestFx = <Params, Done, Fail = Error>(
  configOrHandler: ConfigOrHandler<Params, Done>
): RequestEffect<Params, Done, Fail> => {
  const { handler, cancel, domain = defaultDomain } = normalizeConfig<
    Params,
    Done
  >(configOrHandler);
  const controller = createController({ cancel, domain });

  const fx = domain.createEffect<Params, Done, Fail>(
    async (paramsOrRef: Params | ParamsRef<Params>) => {
      const [params, options] = isParamsRef(paramsOrRef)
        ? paramsOrRef.current
        : [paramsOrRef];

      if (options?.normal) {
        return handler(params, options.controller);
      }

      await nextTick();
      await controller.cancel();

      return handler(params, controller);
    }
  ) as RequestEffect<Params, Done, Fail>;

  return enableFxOptions(fx);
};
