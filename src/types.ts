import { Domain, Effect, Event, Unit } from 'effector';

export type Subscription = {
  unsubscribe: () => void;
  (): void;
};

export interface Controller {
  getSignal: () => AbortSignal;
  cancel: Event<void>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onCancel: (fn: () => any) => Subscription;
}

export interface ControllerConfig {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cancel?: Unit<any>;
  domain?: Domain;
}

export type Handler<Params, Result> = (
  params: Params,
  controller?: Controller
) => Promise<Result> | Result;

export interface Config<Params, Result> {
  handler: Handler<Params, Result>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cancel?: Unit<any>;
  domain?: Domain;
  name?: string;
  sid?: string;
}

export type ConfigOrHandler<Params, Result> =
  | Handler<Params, Result>
  | Config<Params, Result>;

export type Options = {
  normal?: boolean;
  controller?: Controller;
};

export interface RequestEffect<Params, Done, Fail = Error>
  extends Effect<Params, Done, Fail> {
  (payload: Params, options?: Options): Promise<Done>;
}
