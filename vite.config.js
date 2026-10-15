import { defineConfig } from 'vite'
import { readFileSync } from 'node:fs'

const routes = JSON.parse(readFileSync(new URL('./vercel.json', import.meta.url), 'utf8'))

// Use the production routes locally too, including query strings and old links.
function cleanPageRoutes() {
  const configure = server => {
    server.middlewares.use((req, res, next) => {
      const queryAt = req.url.indexOf('?')
      const pathname = queryAt < 0 ? req.url : req.url.slice(0, queryAt)
      const search = queryAt < 0 ? '' : req.url.slice(queryAt)
      const redirect = routes.redirects.find(route => route.source === pathname)
      if (redirect) {
        res.writeHead(redirect.permanent ? 308 : 307, { Location: redirect.destination + search })
        res.end()
        return
      }
      const rewrite = routes.rewrites.find(route => route.source === pathname)
      if (rewrite) req.url = rewrite.destination + search
      next()
    })
  }
  return { name: 'clean-page-routes', configureServer: configure, configurePreviewServer: configure }
}

export default defineConfig({
  plugins: [cleanPageRoutes()],
  esbuild: { jsx: 'automatic' },
  server: { port: 5174, strictPort: true },
  preview: { port: 4174, strictPort: true },
  build: { assetsInlineLimit: 0 },
})
