# `@marcalexiei/fastify-type-provider-zod`

[![CI][CIBadge]][CIURL]
[![Checked with Biome][CheckerBadge]][CheckerURL]
[![npm version][npmVersionBadge]][npmVersionURL]
[![issues][issuesBadge]][issuesURL]

[CIBadge]: https://img.shields.io/github/actions/workflow/status/marcalexiei/fastify-type-provider-zod/CI.yml?style=for-the-badge&logo=github&event=push
[CIURL]: https://github.com/marcalexiei/fastify-type-provider-zod/actions/workflows/CI.yml
[CheckerBadge]: https://img.shields.io/badge/Checked_with-Biome-60a5fa?style=for-the-badge&logo=biome
[CheckerURL]: https://biomejs.dev
[npmVersionBadge]: https://img.shields.io/npm/v/@marcalexiei/fastify-type-provider-zod.svg?style=for-the-badge
[npmVersionURL]: https://www.npmjs.com/package/@marcalexiei/fastify-type-provider-zod
[issuesBadge]: https://img.shields.io/github/issues/marcalexiei/fastify-type-provider-zod.svg?style=for-the-badge
[issuesURL]: https://github.com/marcalexiei/fastify-type-provider-zod/issues

##  Reason

TL;DR; My contribution on the upstream repository are getting missed.

If this changes, I'm more than willing to merge the changes here back to the upstream repo.

<details>

<summary>More details</summary>

My contribution are getting missed: <https://github.com/turkerdev/fastify-type-provider-zod/pull/174#issuecomment-3023602822>

Recent PRs not opened by me are reviewed before mine: <https://github.com/turkerdev/fastify-type-provider-zod/pull/176#issuecomment-3018610310>

This happened in the same way here:

- My PR: <https://github.com/turkerdev/fastify-type-provider-zod/pull/196>
- Another PR opened 3 days later: <https://github.com/turkerdev/fastify-type-provider-zod/pull/197>

Ignored PRs:

- <https://github.com/turkerdev/fastify-type-provider-zod/pull/185> (re add CI tests for windows)
- <https://github.com/turkerdev/fastify-type-provider-zod/pull/186>
- <https://github.com/turkerdev/fastify-type-provider-zod/pull/194>

Ignored issues:

- <https://github.com/turkerdev/fastify-type-provider-zod/pull/181> - maintenance improvements
- <https://github.com/turkerdev/fastify-type-provider-zod/pull/190> - changelog request for 5.0.2

</details>

## Differences from upstream

1. Automated changelog using Changeset
2. CI tests also Windows
3. Less `any` in the source code
4. `oas-validator` (last release 4 years ago) replaced by `@seriousme/openapi-schema-validator`
   (which supports 3.1)
5. Using `swagger` object for OpenAPI standard throws an error instead of a warning
6. Uses `vitest` typechecking rather than `tsd`
7. Type tests are run on `node`, `node16`, `bundler` module resolutions

## Getting started

<https://marcalexiei.github.io/fastify-type-provider-zod/getting-started.html>

## Examples

<https://marcalexiei.github.io/fastify-type-provider-zod/examples.html>

## Credits

This project is built upon [turkerdev/fastify-type-provider-zod](https://github.com/turkerdev/fastify-type-provider-zod)
and wouldn’t be possible without the work of turkerdev and the contributions of the entire community behind it.
