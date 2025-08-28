import type { FastifyErrorConstructor } from '@fastify/error';
import createError from '@fastify/error';
import type { FastifyError } from 'fastify';
// When https://github.com/fastify/fastify/pull/6207 is released when can import from fastify
import type { FastifySchemaValidationError } from 'fastify/types/schema.js';
import type { $ZodError } from 'zod/v4/core';

export const InvalidSchemaError: FastifyErrorConstructor<
  { code: string },
  [string]
> = createError<[string]>(
  'FST_ERR_INVALID_SCHEMA',
  'Invalid schema passed: %s',
  500,
);

const ZodFastifySchemaValidationErrorSymbol: symbol = Symbol.for(
  'ZodFastifySchemaValidationError',
);

export interface ZodFastifySchemaValidationError
  extends FastifySchemaValidationError {
  [ZodFastifySchemaValidationErrorSymbol]: true;
}

const ResponseSerializationBase: FastifyErrorConstructor<
  {
    code: string;
  },
  [
    {
      cause: $ZodError;
    },
  ]
> = createError<[{ cause: $ZodError }]>(
  'FST_ERR_RESPONSE_SERIALIZATION',
  "Response doesn't match the schema",
  500,
);

export class ResponseSerializationError extends ResponseSerializationBase {
  public method: string;
  public url: string;
  public override cause: $ZodError;

  public constructor(
    method: string,
    url: string,
    options: { cause: $ZodError },
  ) {
    super({ cause: options.cause });

    this.method = method;
    this.url = url;
    this.cause = options.cause;
  }
}

export function isResponseSerializationError(
  value: unknown,
): value is ResponseSerializationError {
  return 'method' in (value as ResponseSerializationError);
}

function isZodFastifySchemaValidationError(
  error: unknown,
): error is ZodFastifySchemaValidationError {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as ZodFastifySchemaValidationError)[
      ZodFastifySchemaValidationErrorSymbol
    ] === true
  );
}

export function hasZodFastifySchemaValidationErrors(
  error: unknown,
): error is Omit<FastifyError, 'validation'> & {
  validation: Array<ZodFastifySchemaValidationError>;
} {
  return (
    typeof error === 'object' &&
    error !== null &&
    'validation' in error &&
    Array.isArray(error.validation) &&
    error.validation.length > 0 &&
    isZodFastifySchemaValidationError(error.validation[0])
  );
}

export function createValidationError(
  error: $ZodError,
): Array<ZodFastifySchemaValidationError> {
  return error.issues.map((issue) => {
    const { code, path, message, ...params } = issue;

    return {
      [ZodFastifySchemaValidationErrorSymbol]: true,
      keyword: code,
      instancePath: `/${path.join('/')}`,
      schemaPath: `#/${path.join('/')}/${issue.code}`,
      message,
      params,
    };
  });
}
