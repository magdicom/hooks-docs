import { defineConfig } from 'astro/config'
import starlight from '@astrojs/starlight'

export default defineConfig({
  site: 'https://hooks.momagdi.com',
  trailingSlash: 'ignore',
  output: 'static',
  integrations: [
    starlight({
      title: 'Hooks',
      description: 'Named extension points for PHP with actions, filters, collectors, processors, and renderers.',
      disable404Route: true,
      logo: {
        src: './src/assets/hooks-mark.svg',
        alt: 'Hooks',
      },
      social: [
        { icon: 'github', label: 'Hooks on GitHub', href: 'https://github.com/magdicom/hooks' },
      ],
      editLink: {
        baseUrl: 'https://github.com/magdicom/hooks-docs/edit/main/',
      },
      sidebar: [
        { label: 'Overview', slug: 'docs/2.x/index' },
        {
          label: 'Getting Started',
          items: [
            { label: 'Installation', slug: 'docs/2.x/installation' },
            { label: 'Concepts', slug: 'docs/2.x/concepts' },
          ],
        },
        { label: 'Use Cases', slug: 'docs/2.x/use-cases' },
        {
          label: 'Hook Types',
          items: [
            { label: 'Actions', slug: 'docs/2.x/actions' },
            { label: 'Filters', slug: 'docs/2.x/filters' },
            { label: 'Collectors', slug: 'docs/2.x/collectors' },
          ],
        },
        {
          label: 'Processing Results',
          items: [
            { label: 'Processors', slug: 'docs/2.x/processors' },
            { label: 'Renderers', slug: 'docs/2.x/renderers' },
          ],
        },
        {
          label: 'Integrations',
          items: [{ label: 'Laravel', slug: 'docs/2.x/laravel' }],
        },
        {
          label: 'Reference',
          items: [
            { label: 'API', slug: 'docs/2.x/api' },
            { label: 'Upgrade Guide', slug: 'docs/2.x/upgrade' },
          ],
        },
      ],
      customCss: ['./src/styles/custom.css'],
      components: {
        Head: './src/components/Head.astro',
        Header: './src/components/Header.astro',
        Footer: './src/components/Footer.astro',
      },
    }),
  ],
})
