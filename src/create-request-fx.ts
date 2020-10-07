import { createEffect } from 'effector';

import { createController } from './create-controller';
import { ConfigOrHandler, ParamsRef, RequestEffect } from './types';
import {
  enableFxOptions,
  isParamsRef,
  nextTick,
  normalizeConfig,
} from './utils';

export const createRequestFx = <Params, Done, Fail = Error>(
  configOrHandler: ConfigOrHandler<Params, Done>
): RequestEffect<Params, Done, Fail> => {
  const { handler, cancel } = normalizeConfig<Params, Done>(configOrHandler);
  const controller = createController({ cancel });

  const fx = createEffect<Params, Done, Fail>(
    async (paramsOrRef: Params | ParamsRef<Params>) => {
      const [params, options] = isParamsRef(paramsOrRef)
        ? paramsOrRef.current
        : [paramsOrRef];

      if (options?.normal) {
        return handler(params, createController({ cancel: options?.cancel }));
      }

      await nextTick();
      await controller.cancel();

      return handler(params, controller);
    }
  ) as RequestEffect<Params, Done, Fail>;

  return enableFxOptions(fx);
};
