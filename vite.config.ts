import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: process.env.SITE_BASE_PATH || '/',
  plugins: [react(), {
    name: 'validate-public-qna-config',
    configResolved(config) {
      const url = config.env.VITE_SUPABASE_URL
      const key = config.env.VITE_SUPABASE_PUBLISHABLE_KEY
      if (!url && !key) return
      if (!url || !key || !key.startsWith('sb_publishable_')) {
        throw new Error('Q&A requires VITE_SUPABASE_URL and an sb_publishable_ key. Never put secret or service-role keys in VITE_ variables.')
      }
      const parsed = new URL(url)
      if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.search || parsed.hash || !['', '/'].includes(parsed.pathname)) {
        throw new Error('VITE_SUPABASE_URL must be the HTTPS project origin.')
      }
    },
  }],
})
