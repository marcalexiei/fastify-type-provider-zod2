---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "@marcalexiei/fastify-type-provider-zod"
  text: "Zod Type Provider for Fastify@5"
  image:
    src: /logo.png
    alt: ''
  actions:
    - theme: brand
      text: Getting started
      link: /getting-started
    - theme: alt
      text: Examples
      link: /examples

features:
  - title: Runtime validation + TS types
    icon: ✅
    details: Use Zod schemas to both validate incoming data and infer TypeScript types automatically.
  - title: Response serialization
    icon: 📦
    details: Serialize outgoing responses via Zod, with option to customize the process for special types.
  - title: OpenAPI support
    icon: 📄
    details: Generate API docs automatically from the Zod-defined schemas for request and response shapes.
---

