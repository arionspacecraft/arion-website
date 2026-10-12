import { readFile, writeFile } from 'node:fs/promises'
import { createSnapshot } from './notion-projects.mjs'

const config = JSON.parse(await readFile(new URL('../notion.config.json', import.meta.url), 'utf8'))
const { errorCode, ...snapshot } = await createSnapshot(config, { token: process.env.NOTION_TOKEN })
// Always replace the previous snapshot, including on errors. Never fall back to
// stale project content which might have since been marked confidential.
const source = `// Generated at build time. Never commit this file.\nexport default ${JSON.stringify(snapshot)}\n`
await writeFile(new URL('../src/content/notion-projects.generated.ts', import.meta.url), source)
if (errorCode) console.warn(`Notion sync unavailable (${errorCode}); publishing an empty project list.`)
else console.log(`Notion sync: ${snapshot.projects.length} public projects prepared.`)
if (process.env.GITHUB_OUTPUT) await writeFile(process.env.GITHUB_OUTPUT, `notion_state=${snapshot.state}\n`, { flag: 'a' })
