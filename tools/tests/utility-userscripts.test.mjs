import test from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';
const search=fs.readFileSync('userscripts/standalone/search-engines-clean-dark-ui/search-engines-clean-dark-ui.user.js','utf8');
const poast=fs.readFileSync('userscripts/standalone/poast-timeline-metadata-reset/poast-timeline-metadata-reset.user.js','utf8');
test('search UI preserves keyboard focus and uses semantic controls',()=>{assert.match(search,/:focus-visible/);assert.doesNotMatch(search,/\*\s*\{[^}]*outline:\s*none/is);assert.match(search,/createElement\('button'\)/);assert.match(search,/aria-expanded/)});
test('search mutation handling is incremental',()=>{assert.match(search,/record\.addedNodes/);assert.doesNotMatch(search,/new MutationObserver\(tagResults\)/)});
test('poast source is modular and deterministic',()=>{for(const f of ['src/header.js','src/styles.css','src/runtime.js']) assert.ok(fs.existsSync('userscripts/builders/poast-timeline-metadata-reset/'+f))});
test('poast density preferences remain persistent',()=>{for(const k of ['DENSITY_KEY','GAP_KEY','GRID_KEY','MOBILE_GRID_KEY'])assert.match(poast,new RegExp(k));assert.match(poast,/localStorage\.setItem/)});
test('poast keeps responsive layout contracts',()=>{assert.match(poast,/@media/);assert.match(poast,/--cc-mobile-grid-min/)});
