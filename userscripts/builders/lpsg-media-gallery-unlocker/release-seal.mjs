import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,"../../..");
const generated=path.resolve(here,"../../standalone/lpsg-media-gallery-unlocker/lpsg-media-gallery-unlocker.user.js");
const steps=[];
function run(name,cmd,args,cwd=here){const r=spawnSync(cmd,args,{cwd,encoding:"utf8"});steps.push({name,ok:r.status===0,stdout:(r.stdout||"").trim(),stderr:(r.stderr||"").trim()});if(r.status!==0) throw new Error(`${name} failed`);}
function sha(p){return crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");}
try {
  run("generated output reproducibility","node",["build.mjs","--check"]);
  run("generated userscript syntax","node",["--check",generated]);
  const testFiles=fs.readdirSync(path.join(here,"test")).filter(n=>n.endsWith(".test.mjs")).map(n=>path.join("test",n));
  run("LPSG regression suite","node",["--test",...testFiles],here);
  const report={ok:true,generated,path:path.relative(root,generated),sha256:sha(generated),bytes:fs.statSync(generated).size,steps};
  if(process.argv.includes("--json")) console.log(JSON.stringify(report,null,2)); else {console.log("LPSG release seal: PASS");console.log(`Generated: ${report.path}`);console.log(`SHA-256: ${report.sha256}`);for(const s of steps) console.log(`✓ ${s.name}`);}
} catch(error) {const report={ok:false,error:String(error?.message||error),steps};if(process.argv.includes("--json")) console.log(JSON.stringify(report,null,2));else {console.error("LPSG release seal: FAIL");for(const s of steps) console.error(`${s.ok?"✓":"✗"} ${s.name}`);console.error(report.error);}process.exit(1);}
