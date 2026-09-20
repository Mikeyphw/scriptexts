import test from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';
const css=fs.readFileSync(new URL('../src/styles.css',import.meta.url),'utf8'); const runtime=fs.readFileSync(new URL('../src/runtime.js',import.meta.url),'utf8'); const fixture=fs.readFileSync(new URL('./fixtures/timeline.html',import.meta.url),'utf8');
test('captured timeline fixture represents rail and post content',()=>{assert.match(fixture,/timeline-container/);assert.match(fixture,/timeline-item/);assert.match(fixture,/tweet-content/)});
test('responsive contracts include mobile and desktop breakpoints',()=>{assert.match(css,/@media/);assert.match(css,/--cc-mobile-grid-min/);assert.match(css,/grid-template-columns/)});
test('density configuration persists and is bounded',()=>{assert.match(runtime,/localStorage\.getItem\(DENSITY_KEY\)/);assert.match(runtime,/localStorage\.setItem/);assert.match(runtime,/function clamp/)});
test('runtime avoids periodic whole-page polling',()=>{assert.doesNotMatch(runtime,/setInterval\s*\(/)});
test('stylesheet avoids universal important reset',()=>{assert.doesNotMatch(css,/^\s*\*\s*\{/m)});
