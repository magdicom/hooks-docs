import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'
import { execFileSync } from 'node:child_process'
import process from 'node:process'

const root = process.cwd()
const docsRoot = join(root, 'src', 'content', 'docs')
const distRoot = join(root, 'dist')
const failures = []

const fail = (message) => failures.push(message)
const filesUnder = (directory, extension) => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const path = join(directory, entry.name)
  if (entry.isDirectory()) return filesUnder(path, extension)
  const extensions = Array.isArray(extension) ? extension : [extension]
  return extensions.some((suffix) => path.endsWith(suffix)) ? [path] : []
})

const markdownFiles = filesUnder(docsRoot, ['.md', '.mdx'])
const sourceFiles = [...markdownFiles, join(root, 'src', 'pages', 'index.astro')]
const markdown = markdownFiles.map((file) => ({ file, text: readFileSync(file, 'utf8') }))

for (const { file, text } of markdown) {
  const name = relative(root, file)
  if (!text.startsWith('---\n') || !/^title:\s*.+$/m.test(text) || !/^description:\s*.+$/m.test(text)) {
    fail(`${name}: missing title/description frontmatter`)
  }
  const fences = text.match(/^[ \t]*```/gm) ?? []
  if (fences.length % 2 !== 0) fail(`${name}: unclosed Markdown code fence`)
  if (/planned for the next documentation implementation task/i.test(text)) {
    fail(`${name}: placeholder documentation text remains`)
  }
  if (text.includes('<Tabs')) {
    for (const match of text.matchAll(/<Tabs\b([^>]*)>([\s\S]*?)<\/Tabs>/g)) {
      if (!match[1].includes('syncKey="framework"')) fail(`${name}: tab group must use syncKey="framework"`)
      const labels = [...match[2].matchAll(/<TabItem\s+label="([^"]+)"/g)].map((tab) => tab[1])
      if (labels.length !== 2 || labels[0] !== 'PHP' || labels[1] !== 'Laravel') fail(`${name}: tab group must use exactly PHP then Laravel labels`)
    }
  }
}

const plannedRoutes = [
  '/', '/docs', '/docs/2.x/', '/docs/2.x/installation', '/docs/2.x/concepts', '/docs/2.x/use-cases',
  '/docs/2.x/actions', '/docs/2.x/filters', '/docs/2.x/collectors',
  '/docs/2.x/processors', '/docs/2.x/renderers', '/docs/2.x/laravel',
  '/docs/2.x/upgrade', '/docs/2.x/api',
]
const distPathFor = (route) => join(distRoot, route === '/' ? 'index.html' : route === '/docs' ? 'docs/index.html' : `${route.replace(/\/$/, '')}/index.html`)
for (const route of plannedRoutes) if (!existsSync(distPathFor(route))) fail(`dist: missing planned route ${route}`)
if (!existsSync(join(distRoot, 'robots.txt'))) fail('dist: robots.txt is missing')
if (!existsSync(join(distRoot, 'sitemap-index.xml'))) fail('dist: sitemap-index.xml is missing')
const representativeHtml = readFileSync(join(distRoot, 'docs', '2.x', 'index.html'), 'utf8')
if (!representativeHtml.includes('https://hooks.momagdi.com/docs/2.x/')) fail('docs/2.x: canonical URL is missing or incorrect')
if (!representativeHtml.includes('property="og:title"')) fail('docs/2.x: Open Graph metadata is missing')
if (!representativeHtml.includes('https://github.com/magdicom/hooks-docs/edit/main/src/content/docs/2.x/index.md')) fail('docs/2.x: edit link is missing or incorrect')

const routeForMarkdown = (file) => {
  const path = relative(docsRoot, file).replace(/\.(?:md|mdx)$/, '')
  if (path === 'index') return '/docs'
  return `/docs/${path}`
}
const internalLinks = []
for (const { file, text } of markdown) {
  for (const match of text.matchAll(/\]\((\/[^)#?]*)[^)]*\)/g)) internalLinks.push({ file, target: match[1] })
}
for (const { file, target } of internalLinks) {
  const normalizedTarget = target.replace(/\/$/, '') || '/'
  if (target.startsWith('/docs/') && !plannedRoutes.includes(target) && !plannedRoutes.includes(normalizedTarget) && !plannedRoutes.includes(`${normalizedTarget}/`)) {
    fail(`${relative(root, file)}: internal link has no planned route: ${target}`)
  }
}

const config = readFileSync(join(root, 'astro.config.mjs'), 'utf8')
for (const match of config.matchAll(/slug:\s*'([^']+)'/g)) {
  const route = `/${match[1].replace(/\/index$/, '')}`
  if (!plannedRoutes.includes(route) && !plannedRoutes.includes(`${route}/`)) fail(`astro.config.mjs: sidebar route is not planned: ${route}`)
}
if (config.includes("label: '2.x Beta'")) fail('astro.config.mjs: redundant 2.x Beta sidebar group remains')
const sidebarOrder = ['docs/2.x/concepts', 'docs/2.x/use-cases', 'docs/2.x/actions']
const sidebarPositions = sidebarOrder.map((slug) => config.indexOf(`slug: '${slug}'`))
if (sidebarPositions.some((position) => position < 0) || sidebarPositions[0] > sidebarPositions[1] || sidebarPositions[1] > sidebarPositions[2]) {
  fail('astro.config.mjs: Use Cases must appear after Concepts and before Actions')
}

const phpBlocks = markdown.flatMap(({ file, text }) => [...text.matchAll(/^[ \t]*```php\n([\s\S]*?)^[ \t]*```/gm)].map((match) => ({ file, code: match[1] })))
const allowedMethods = new Set([
  'addAction', 'addFilter', 'addCollector', 'doAction', 'applyFilters', 'collect', 'setProcessor',
  'setRenderer', 'process', 'render', 'removeAction', 'removeFilter', 'removeCollector', 'removeAll',
  'removeAllActions', 'removeAllFilters', 'removeAllCollectors', 'has', 'hasAction', 'hasFilter',
  'hasCollector', 'count', 'listeners', 'actions', 'filters', 'collectors', 'debug', 'setSourceFile',
  'getSourceFile', 'id', 'hookPoint', 'type', 'priority', 'remove', 'belongsTo',
])
for (const { file, code } of phpBlocks) {
  const name = relative(root, file)
  const completeExample = code.includes('<?php')
  for (const match of code.matchAll(/(?:\$hooks|hooks\(\))\s*->\s*(\w+)\s*\(/g)) {
    if (!allowedMethods.has(match[1])) fail(`${name}: unknown Hooks method in PHP example: ${match[1]}`)
  }
  if (completeExample && /\$hooks\s*->/.test(code) && !/new\s+Hooks\s*\(/.test(code) && !/\$hooks\s*=/.test(code)) fail(`${name}: core example uses $hooks without defining it`)
}

const allText = sourceFiles.map((file) => readFileSync(file, 'utf8')).join('\n')
if (!allText.includes('composer require magdicom/hooks:"^2.0@beta"')) fail('installation: core beta Composer command is missing')
if (!allText.includes('composer require magdicom/laravel-hooks:"^2.0@beta" magdicom/hooks:"^2.0@beta"')) fail('installation: Laravel beta Composer command is missing')
if (/Magdicom\\Hooks::(?!class\b)/.test(allText)) fail('source: core Magdicom\\Hooks must not be documented with static calls')
if (!allText.includes('use Magdicom\\LaravelHooks\\Facades\\Hooks;')) fail('laravel: complete facade import is missing')
if (!allText.includes('hooks()->addAction(')) fail('laravel: helper calling style is missing')
if (!allText.includes('Magdicom\\Processors\\FirstProcessor')) fail('processors: plural built-in namespace is missing')
if (allText.includes('Magdicom\\Processor\\')) fail('source: singular processor namespace remains in public documentation')
for (const hookPoint of ['invoice.paid', 'invoice.total', 'dashboard.widgets', 'checkout.payment_methods', 'order.receipt.sections', 'checkout.allowed']) {
  if (!allText.includes(hookPoint)) fail(`use-cases: expected hook point is missing: ${hookPoint}`)
}
if (/magdicom\/hook(?!s)/.test(allText)) fail('source: incorrect core package name detected')
if (/magdicom\/laravel-hook(?!s)/.test(allText)) fail('source: incorrect Laravel package name detected')

const trackedFiles = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean).map((file) => join(root, file))
for (const file of trackedFiles) {
  const text = readFileSync(file, 'utf8')
  if (/-----BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY-----|ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}/.test(text)) fail(`${relative(root, file)}: possible committed secret detected`)
}

if (failures.length > 0) {
  console.error(failures.map((failure) => `- ${failure}`).join('\n'))
  process.exit(1)
}

console.log(`Documentation validation passed: ${markdownFiles.length} Markdown files, ${phpBlocks.length} PHP examples, ${plannedRoutes.length} planned routes.`)
