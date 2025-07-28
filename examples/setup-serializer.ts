import {
  createSerializerCompiler,
  validatorCompiler,
  type ZodSerializerCompilerOptions,
} from '@marcalexiei/fastify-type-provider-zod';
import Fastify from 'fastify';

const app = Fastify();

const replacer: ZodSerializerCompilerOptions['replacer'] = function (
  key,
  value,
) {
  if (this[key] instanceof Date) {
    return { _date: value.toISOString() };
  }
  return value;
};

// Create a custom serializer compiler
const customSerializerCompiler = createSerializerCompiler({ replacer });

// Add schema validator and serializer
app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(customSerializerCompiler);

// ...

app.listen({ port: 4949 });
