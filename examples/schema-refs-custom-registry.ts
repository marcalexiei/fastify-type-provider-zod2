import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUI from '@fastify/swagger-ui';
import type {
  ZodOpenApiSchemaMetadata,
  ZodTypeProvider,
} from '@marcalexiei/fastify-type-provider-zod';
import {
  createJsonSchemaTransform,
  createJsonSchemaTransformObject,
  serializerCompiler,
  validatorCompiler,
} from '@marcalexiei/fastify-type-provider-zod';
import fastify from 'fastify';
import { registry, z } from 'zod';

const schemaRegistry = registry<ZodOpenApiSchemaMetadata>();

const USER_SCHEMA = z
  .object({
    id: z.number().int().positive(),
    name: z.string().describe('The name of the user'),
  })
  .register(schemaRegistry, {
    id: 'User', // <--- THIS MUST BE UNIQUE AMONG SCHEMAS
    description: 'User information',
  });

const app = fastify();
app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.register(fastifySwagger, {
  openapi: {
    info: {
      title: 'SampleApi',
      description: 'Sample backend service',
      version: '1.0.0',
    },
    servers: [],
  },
  transform: createJsonSchemaTransform({ schemaRegistry }),
  transformObject: createJsonSchemaTransformObject({ schemaRegistry }),
});

app.register(fastifySwaggerUI, {
  routePrefix: '/documentation',
});

app.after(() => {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/users',
    schema: {
      response: {
        200: USER_SCHEMA.array(),
      },
    },
    handler: (_req, res) => {
      res.send([]);
    },
  });
});

async function run() {
  await app.ready();

  const url = await app.listen({
    port: 4949,
  });

  app.log.info(`Documentation running at ${url}`);
}

run().catch(() => {});
