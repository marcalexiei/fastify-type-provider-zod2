import type { FastifySchemaValidationError } from 'fastify/types/schema.js';
import { describe, expectTypeOf, it } from 'vitest';

import {
  hasZodFastifySchemaValidationErrors,
  type ZodFastifySchemaValidationError,
} from '../src/index.ts';

describe('ZodFastifySchemaValidationError', () => {
  it('should be assignable to FastifySchemaValidationError', () => {
    expectTypeOf<ZodFastifySchemaValidationError>().toExtend<FastifySchemaValidationError>();
  });

  describe('hasZodFastifySchemaValidationErrors', () => {
    it('should narrow type to ZodFastifySchemaValidationError', () => {
      const error: unknown = {};
      if (hasZodFastifySchemaValidationErrors(error)) {
        expectTypeOf<ZodFastifySchemaValidationError>().toEqualTypeOf(
          error.validation[0],
        );

        for (const validationError of error.validation) {
          expectTypeOf<ZodFastifySchemaValidationError>().toEqualTypeOf(
            validationError,
          );
        }
      }
    });
  });
});
