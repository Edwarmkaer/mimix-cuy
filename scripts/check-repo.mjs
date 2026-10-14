import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { cwd: root })
  .toString().split('\0').filter(Boolean)
const localDirectories = new Set([
  '.cursor', '.freebuff', '.impeccable', '.railway', '.turbo', '.vercel',
  'graphify-out', 'screenshots', 'node_modules', 'dist', 'test-results',
])
const unexpected = files.filter(file =>
  file.split('/').some(part => localDirectories.has(part) || /^\.env(?:\.|$)/.test(part)) ||
  file.startsWith('public/vendor/') || file.startsWith('public/experiences/'))

if (unexpected.length) {
  console.error('Archivos locales o generados incluidos en el repositorio:\n' + unexpected.join('\n'))
  process.exitCode = 1
} else {
  console.log(`Contenido público verificado: ${files.length} archivos de código, recursos y documentación.`)
}
