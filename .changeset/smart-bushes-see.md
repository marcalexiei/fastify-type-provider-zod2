---
"@marcalexiei/fastify-type-provider-zod": major
---

Use Zod’s built-in `toJSONSchema` with the `openapi-3.0` target instead of relying on a custom conversion from `draft-2020-12` to OpenAPI 3.0.

> [!WARNING]
> **Breaking Change**  
>
> - Dropped support for `zod@3`  
> - Requires **`zod@4.1.3` or later**  
>
> Why not `^4.1.0`? Versions before `4.1.3` contain bugs that affect `openapi-3.0` schema output.  
>
> See [issue #37](https://github.com/marcalexiei/fastify-type-provider-zod/issues/37) for more details.
