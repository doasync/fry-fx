import { Effect, Unit, Domain } from 'effector';

export interface Controller {
  getSignal: Effect<void, AbortSignal>;
  cancel: Effect<void, void>;
}

export interface ControllerConfig {
  cancel?: Unit<unknown>;
  domain?: Domain;
}

export type Handler<Params, Result> = (
  params: Params,
  controller?: Controller
) => Promise<Result>;

export interface Config<Params, Result> {
  handler: Handler<Params, Result>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cancel?: Unit<any>;
  domain?: Domain;
}

export type ConfigOrHandler<Params, Result> =
  | Handler<Params, Result>
  | Config<Params, Result>;

export type FxOptions = {
  normal?: boolean;
  controller?: Controller;
};

export interface RequestEffect<Params, Done, Fail = Error>
  extends Effect<Params, Done, Fail> {
  (payload: Params, options: FxOptions): Promise<Done>;
}

export type ParamsRef<Params> = { current: [Params, FxOptions?] };
