import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Hooks',
  description: 'Composable actions, filters, and result collection for modern PHP applications.',
  lang: 'en-US',
  cleanUrls: true,
  srcExclude: [
    'README.md',
    'AGENTS.md',
    'information-architecture.md',
    'source-audit.md',
  ],
  lastUpdated: true,
  sitemap: {
    hostname: 'https://hooks.momagdi.com',
  },
  themeConfig: {
    siteTitle: 'Hooks',
    logo: '/hooks-mark.svg',
    nav: [
      { text: 'Docs', link: '/docs/2.x/' },
      { text: 'Concepts', link: '/docs/2.x/concepts' },
      { text: 'Laravel', link: '/docs/2.x/laravel' },
      { text: 'Upgrade', link: '/docs/2.x/upgrade' },
      {
        text: '2.x Beta',
        items: [
          { text: '2.x Beta', link: '/docs/2.x/' },
          { text: '1.x (historical)', link: '/docs/2.x/upgrade#version-1' },
        ],
      },
      { text: 'GitHub', link: 'https://github.com/magdicom/hooks' },
    ],
    sidebar: {
      '/docs/2.x/': [
        {
          text: 'Overview',
          items: [
            { text: 'Introduction', link: '/docs/2.x/' },
            { text: 'Installation', link: '/docs/2.x/installation' },
            { text: 'Concepts', link: '/docs/2.x/concepts' },
          ],
        },
        {
          text: 'Hook types',
          items: [
            { text: 'Actions', link: '/docs/2.x/actions' },
            { text: 'Filters', link: '/docs/2.x/filters' },
            { text: 'Collectors', link: '/docs/2.x/collectors' },
          ],
        },
        {
          text: 'Collector results',
          items: [
            { text: 'Processors', link: '/docs/2.x/processors' },
            { text: 'Renderers', link: '/docs/2.x/renderers' },
          ],
        },
        {
          text: 'Integration',
          items: [{ text: 'Laravel', link: '/docs/2.x/laravel' }],
        },
        {
          text: 'Migration and reference',
          items: [
            { text: 'Upgrade from 1.x', link: '/docs/2.x/upgrade' },
            { text: 'API reference', link: '/docs/2.x/api' },
          ],
        },
      ],
    },
    search: {
      provider: 'local',
    },
    editLink: {
      pattern: 'https://github.com/magdicom/hooks-docs/edit/main/:path',
      text: 'Edit this page on GitHub',
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/magdicom/hooks' },
    ],
    footer: {
      message: 'Hooks 2.x Beta',
      copyright: 'Released under the MIT License.',
    },
  },
  markdown: {
    languageAlias: {
      blade: 'html',
    },
  },
})
