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
  return path.endsWith(extension) ? [path] : []
})

const markdownFiles = filesUnder(docsRoot, '.md')
const sourceFiles = [...markdownFiles, join(root, 'src', 'pages', 'index.astro')]
const markdown = markdownFiles.map((file) => ({ file, text: readFileSync(file, 'utf8') }))

for (const { file, text } of markdown) {
  const name = relative(root, file)
  if (!text.startsWith('---\n') || !/^title:\s*.+$/m.test(text) || !/^description:\s*.+$/m.test(text)) {
    fail(`${name}: missing title/description frontmatter`)
  }
  const fences = text.match(/^```/gm) ?? []
  if (fences.length % 2 !== 0) fail(`${name}: unclosed Markdown code fence`)
  if (/planned for the next documentation implementation task/i.test(text)) {
    fail(`${name}: placeholder documentation text remains`)
  }
}

const plannedRoutes = [
  '/', '/docs', '/docs/2.x/', '/docs/2.x/installation', '/docs/2.x/concepts',
  '/docs/2.x/actions', '/docs/2.x/filters', '/docs/2.x/collectors',
  '/docs/2.x/processors', '/docs/2.x/renderers', '/docs/2.x/laravel',
  '/docs/2.x/upgrade', '/docs/2.x/api',
]
const distPathFor = (route) => join(distRoot, route === '/' ? 'index.html' : route === '/docs' ? 'docs/index.html' : `${route.replace(/\/$/, '')}/index.html`)
for (const route of plannedRoutes) if (!existsSync(distPathFor(route))) fail(`dist: missing planned route ${route}`)

const routeForMarkdown = (file) => {
  const path = relative(docsRoot, file).replace(/\.md$/, '')
  if (path === 'index') return '/docs'
  return `/docs/${path}`
}
const internalLinks = []
for (const { file, text } of markdown) {
  for (const match of text.matchAll(/\]\((\/[^)#?]*)[^)]*\)/g)) internalLinks.push({ file, target: match[1] })
}
for (const { file, target } of internalLinks) {
  if (target.startsWith('/docs/') && !plannedRoutes.includes(target) && !plannedRoutes.includes(`${target}/`)) {
    fail(`${relative(root, file)}: internal link has no planned route: ${target}`)
  }
}

const config = readFileSync(join(root, 'astro.config.mjs'), 'utf8')
for (const match of config.matchAll(/slug:\s*'([^']+)'/g)) {
  const route = `/${match[1].replace(/\/index$/, '')}`
  if (!plannedRoutes.includes(route) && !plannedRoutes.includes(`${route}/`)) fail(`astro.config.mjs: sidebar route is not planned: ${route}`)
}

const phpBlocks = markdown.flatMap(({ file, text }) => [...text.matchAll(/```php\n([\s\S]*?)```/g)].map((match) => ({ file, code: match[1] })))
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
  if (completeExample && !code.includes('declare(strict_types=1);')) fail(`${name}: PHP example is missing declare(strict_types=1);`)
  for (const match of code.matchAll(/(?:\$\w+|hooks\(\))\s*->\s*(\w+)\s*\(/g)) {
    if (!allowedMethods.has(match[1])) fail(`${name}: unknown Hooks method in PHP example: ${match[1]}`)
  }
  if (completeExample && /\$hooks\s*->/.test(code) && !/new\s+Hooks\s*\(/.test(code) && !/\$hooks\s*=/.test(code)) fail(`${name}: core example uses $hooks without defining it`)
}

const allText = sourceFiles.map((file) => readFileSync(file, 'utf8')).join('\n')
if (!allText.includes('composer require magdicom/hooks:"^2.0@beta"')) fail('installation: core beta Composer command is missing')
if (!allText.includes('composer require magdicom/laravel-hooks:"^2.0@beta" magdicom/hooks:"^2.0@beta"')) fail('installation: Laravel beta Composer command is missing')
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
