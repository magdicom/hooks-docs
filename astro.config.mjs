import { defineConfig } from 'astro/config'
import starlight from '@astrojs/starlight'

export default defineConfig({
  site: 'https://hooks.momagdi.com',
  trailingSlash: 'ignore',
  output: 'static',
  integrations: [
    starlight({
      title: 'Hooks',
      description: 'Composable actions, filters, and result collection for modern PHP applications.',
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
        {
          label: '2.x Beta',
          items: [
            {
              label: 'Overview',
              items: [
                { label: 'Introduction', slug: 'docs/2.x/index' },
                { label: 'Installation', slug: 'docs/2.x/installation' },
                { label: 'Concepts', slug: 'docs/2.x/concepts' },
              ],
            },
            {
              label: 'Hook types',
              items: [
                { label: 'Actions', slug: 'docs/2.x/actions' },
                { label: 'Filters', slug: 'docs/2.x/filters' },
                { label: 'Collectors', slug: 'docs/2.x/collectors' },
              ],
            },
            {
              label: 'Collector results',
              items: [
                { label: 'Processors', slug: 'docs/2.x/processors' },
                { label: 'Renderers', slug: 'docs/2.x/renderers' },
              ],
            },
            {
              label: 'Integration',
              items: [{ label: 'Laravel', slug: 'docs/2.x/laravel' }],
            },
            {
              label: 'Migration and reference',
              items: [
                { label: 'Upgrade from 1.x', slug: 'docs/2.x/upgrade' },
                { label: 'API reference', slug: 'docs/2.x/api' },
              ],
            },
          ],
        },
      ],
      customCss: ['./src/styles/custom.css'],
      components: {
        Header: './src/components/Header.astro',
      },
    }),
  ],
})
