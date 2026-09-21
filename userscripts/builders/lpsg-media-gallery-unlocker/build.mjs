import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
const here=path.dirname(fileURLToPath(import.meta.url));
const shared=path.resolve(here,"../media-gallery/build.mjs");
const args=[shared,"--site=lpsg",...(process.argv.includes("--check")?["--check"]:[])];
const result=spawnSync(process.execPath,args,{stdio:"inherit"}); process.exit(result.status??1);
