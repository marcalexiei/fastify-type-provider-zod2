import { defineConfig } from 'vitepress';

const base = '/fastify-type-provider-zod';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  // https://vitepress.dev/guide/deploy#github-pages
  base,

  // This should have @marcalexiei as prefix but is breaking header layout since is quite long
  title: 'fastify-type-provider-zod',
  description: 'Zod Type Provider for Fastify@5',
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Examples', link: '/examples' },
    ],

    sidebar: [
      {
        text: 'Getting started',
        link: '/getting-started',
      },
      {
        text: 'Setup',
        link: '/setup',
      },
      {
        text: 'Examples',
        link: '/examples',
      },
    ],

    socialLinks: [
      {
        icon: 'github',
        link: 'https://github.com/marcalexiei/fastify-type-provider-zod',
      },
    ],

    search: {
      provider: 'local',
    },

    editLink: {
      pattern:
        'https://github.com/marcalexiei/fastify-type-provider-zod/edit/main/docs/:path',
    },
  },
  lastUpdated: true,
});
