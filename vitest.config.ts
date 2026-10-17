import { fileURLToPath } from 'node:url'
import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'

// Fresh checkouts have no generated Notion snapshot. Tests use a public fixture
// so they never require the deployment token or a live workspace response.
export default mergeConfig(viteConfig, defineConfig({
  resolve: { alias: [{
    find: /^.*notion-projects\.generated\.ts$/,
    replacement: fileURLToPath(new URL('./tests/fixtures/notion-projects.ts', import.meta.url)),
  }] },
}))
