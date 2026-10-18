import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { projects } from '../src/content/projects.ts'
import { news } from '../src/content/news.ts'

// GitHub Pages has no SPA rewrite rule. Give every published route an entry
// document so direct links and refreshes return HTTP 200, with the same app.
const output = fileURLToPath(new URL('../dist/', import.meta.url))
const html = await readFile(join(output, 'index.html'), 'utf8')
const routes = [
  'about', 'projects', 'teams', 'news', 'recruit', 'contact', 'qna',
  ...projects.map(({ slug }) => `projects/${slug}`),
  ...news.map(({ slug }) => `news/${slug}`),
]

for (const route of routes) {
  if (!/^[a-z0-9-]+(?:\/[a-z0-9-]+)?$/.test(route)) {
    throw new Error(`Invalid public route: ${route}`)
  }
  const directory = join(output, route)
  await mkdir(directory, { recursive: true })
  await writeFile(join(directory, 'index.html'), html)
}
await writeFile(join(output, '404.html'), html)
await writeFile(join(output, '.nojekyll'), '')
console.log(`Prepared ${routes.length} direct-entry routes for GitHub Pages.`)
