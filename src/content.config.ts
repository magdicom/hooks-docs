import { defineCollection } from 'astro:content'
import { docsLoader, i18nLoader } from '@astrojs/starlight/loaders'
import { docsSchema, i18nSchema } from '@astrojs/starlight/schema'

export const collections = {
  docs: defineCollection({
    loader: docsLoader({
      generateId: ({ entry }) => {
        const path = entry.split('.').slice(0, -1).join('.')
        return path === '404' ? '404' : `docs/${path}`
      },
    }),
    schema: docsSchema(),
  }),
  i18n: defineCollection({ loader: i18nLoader(), schema: i18nSchema() }),
}
