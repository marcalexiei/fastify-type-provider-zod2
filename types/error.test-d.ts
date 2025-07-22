import type { FastifySchemaValidationError } from 'fastify/types/schema';
import { expectAssignable } from 'tsd';

import {
  hasZodFastifySchemaValidationErrors,
  type ZodFastifySchemaValidationError,
} from '../src/errors';

expectAssignable<FastifySchemaValidationError>(
  {} as ZodFastifySchemaValidationError,
);

const error: unknown = {};
if (hasZodFastifySchemaValidationErrors(error)) {
  expectAssignable<ZodFastifySchemaValidationError>(error.validation[0]);

  for (const validationError of error.validation) {
    expectAssignable<ZodFastifySchemaValidationError>(validationError);
  }
}
