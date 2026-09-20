import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const here=path.dirname(fileURLToPath(import.meta.url));
const modules=JSON.parse(fs.readFileSync(path.join(here,"modules.json"),"utf8"));
const output=modules.map(name=>fs.readFileSync(path.join(here,"src",name),"utf8")).join("");
const target=path.resolve(here,"../../standalone/lpsg-media-gallery-unlocker/lpsg-media-gallery-unlocker.user.js");
if(process.argv.includes("--check")){const current=fs.readFileSync(target,"utf8");if(current!==output){console.error("LPSG generated userscript is stale; run npm run build.");process.exit(1);}console.log("LPSG generated userscript is reproducible.");}else{fs.writeFileSync(target,output);console.log(`Built ${target}`);}
