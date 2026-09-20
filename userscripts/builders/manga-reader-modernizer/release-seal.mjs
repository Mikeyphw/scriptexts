import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
const steps=[
 ["generated output reproducibility",["node","build.mjs","--check"]],
 ["supported-site regression suite",["node","--test","test/*.test.mjs"]],
 ["YaoiMangaOnline syntax",["node","--check","dist/yaoimangaonline-modern-reader.user.js"]],
 ["BaraMangaOnline syntax",["node","--check","dist/baramangaonline-modern-reader.user.js"]],
];
for(const [name,cmd] of steps){ const r=spawnSync(cmd[0],cmd.slice(1),{shell:true,stdio:"inherit"}); if(r.status!==0){console.error(`Manga reader release seal: FAIL (${name})`);process.exit(r.status||1);} console.log(`✓ ${name}`); }
for(const file of ["dist/yaoimangaonline-modern-reader.user.js","dist/baramangaonline-modern-reader.user.js"]){const sha=createHash("sha256").update(readFileSync(file)).digest("hex");console.log(`${file}: ${sha}`)}
console.log("Manga reader release seal: PASS");
