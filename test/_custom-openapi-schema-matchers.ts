import { Validator } from '@seriousme/openapi-schema-validator';
import { expect } from 'vitest';

import 'vitest';

interface CustomMatchers<R = unknown> {
  toBeValidOpenAPISchema: () => R;
}

// https://vitest.dev/guide/extending-matchers
declare module 'vitest' {
  // biome-ignore lint/suspicious/noExplicitAny: same as vite documentation
  interface Assertion<T = any> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}

const validator = new Validator();

expect.extend({
  async toBeValidOpenAPISchema(
    this: { isNot: boolean },
    openAPISpecs: Record<string, unknown>,
  ): Promise<{ pass: boolean; message: () => string }> {
    const res = await validator.validate(openAPISpecs);

    const messages = [
      `OpenAPI schema is${this.isNot ? '' : ' not'} valid against ${validator.version}`,
    ];

    if (!res.valid) {
      messages.push(JSON.stringify(res.errors, null, 2));
    }

    return {
      pass: res.valid,
      message: () => messages.join('\n'),
    };
  },
});
