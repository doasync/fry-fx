import { Config, ConfigOrHandler, ParamsRef } from './types';
import { defaultDomain } from './domain';

export const normalizeConfig = <Params, Result>(
  config: ConfigOrHandler<Params, Result>
): Config<Params, Result> =>
  typeof config === 'function'
    ? {
        handler: config,
        cancel: undefined,
        domain: defaultDomain,
      }
    : config;

const paramsRef: ParamsRef<void> = { current: [undefined] };

export const isParamsRef = <Params>(
  params: Params | ParamsRef<Params>
): params is ParamsRef<Params> =>
  // @ts-expect-error: no overlap
  params === paramsRef;

export const enableFxOptions = <T>(fx: T): T => {
  // @ts-expect-error: internal .create
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const defaultCreate = fx.create;
  // @ts-expect-error: internal .create
  // eslint-disable-next-line no-param-reassign
  fx.create = (params, [options]) => {
    paramsRef.current = [params, options];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-return
    return defaultCreate(paramsRef);
  };

  return fx;
};

export const nextTick = async (): Promise<void> =>
  new Promise(resolve => setTimeout(resolve));
