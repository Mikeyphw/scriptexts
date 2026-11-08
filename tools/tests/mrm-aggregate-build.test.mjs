import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const scripts = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')).scripts
const builderPath = 'userscripts/builders/myreadingmanga-reimagined'

test('CI bootstraps ignored MRM outputs before a verification-only root build', () => {
  const verifier = `npm --prefix ${builderPath} run build:verify`
  assert.equal(scripts['build:mrm-reimagined'], verifier)
  assert.equal(scripts['build:mrm-reimagined:write'], `npm --prefix ${builderPath} run build`)
  assert.ok(scripts['build:userscripts'].includes('npm run build:mrm-reimagined'))

  const workflow = readFileSync(new URL('../../.github/workflows/validate.yml', import.meta.url), 'utf8')
  const bootstrap = 'run: npm run build:mrm-reimagined:write'
  const aggregate = 'run: npm run build\n'
  const bootstrapIndex = workflow.indexOf(bootstrap)
  const aggregateIndex = workflow.indexOf(aggregate)
  assert.ok(bootstrapIndex > workflow.indexOf('run: npm install'))
  assert.ok(aggregateIndex > bootstrapIndex, 'CI must generate ignored dist before verification-only root build')
  assert.ok(workflow.indexOf('run: npm run check') > aggregateIndex)
})

test('MRM --check still rejects missing or stale generated files', () => {
  const builder = readFileSync(new URL('../../userscripts/builders/myreadingmanga-reimagined/build.mjs', import.meta.url), 'utf8')
  assert.ok(builder.includes('const checkOnly = process.argv.includes("--check")'))
  assert.ok(builder.includes('if (mismatches.length)'))
  assert.ok(builder.includes('throw new Error(`Generated artifacts are stale:'))
})
