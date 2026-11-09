import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const root = new URL('../../', import.meta.url)

test('Stardew release inventory stays aligned to the Firefox manifest', () => {
  const projects = JSON.parse(readFileSync(new URL('repo-manifest.json', root), 'utf8')).projects
  const project = projects.find(p => p.path === 'extensions/stardew-nexus-download-queue')
  assert.ok(project, 'Stardew queue release project missing')
  const extension = JSON.parse(readFileSync(new URL('extensions/stardew-nexus-download-queue/src/manifest.json', root), 'utf8'))
  assert.equal(project.version, extension.version)
  assert.ok(project.install_artifacts.includes(`dist/stardew-nexus-download-queue-${extension.version}.xpi`))
  assert.ok(project.install_artifacts.includes('dist/SHA256SUMS'))
})

test('aggregate test lane serializes extension builds that share XPI outputs', () => {
  const aggregate = readFileSync(new URL('tools/check-userscripts.mjs', root), 'utf8')
  assert.match(aggregate, /\["validation regression tests", process\.execPath, \["--test", "--test-concurrency=1", "tools\/tests\/\*\.test\.mjs"\]\]/)
})
