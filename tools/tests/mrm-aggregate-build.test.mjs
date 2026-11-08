import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const scripts = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')).scripts
const builderPath = 'userscripts/builders/myreadingmanga-reimagined'

test('root build creates ignored MRM outputs before verifying their freshness', () => {
  const script = scripts['build:mrm-reimagined']
  const producer = 'npm run build:mrm-reimagined:write'
  const verifier = `npm --prefix ${builderPath} run build:verify`
  assert.ok(script.indexOf(producer) !== -1)
  assert.ok(script.indexOf(verifier) > script.indexOf(producer))
  assert.equal(scripts['build:mrm-reimagined:write'], `npm --prefix ${builderPath} run build`)
  assert.ok(scripts['build:userscripts'].includes('npm run build:mrm-reimagined'))
})

test('MRM --check still rejects missing or stale generated files', () => {
  const builder = readFileSync(new URL('../../userscripts/builders/myreadingmanga-reimagined/build.mjs', import.meta.url), 'utf8')
  assert.ok(builder.includes('const checkOnly = process.argv.includes("--check")'))
  assert.ok(builder.includes('if (mismatches.length)'))
  assert.ok(builder.includes('throw new Error(`Generated artifacts are stale:'))
})
