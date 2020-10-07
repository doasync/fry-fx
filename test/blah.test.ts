import { createRequestFx } from '../src';

describe('test', () => {
  it('works', () => {
    createRequestFx(async () => fetch('https://effector.now.sh/'));
  });
});
