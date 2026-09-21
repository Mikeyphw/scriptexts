import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const here=path.dirname(fileURLToPath(import.meta.url));
const site=(process.argv.find(a=>a.startsWith("--site="))||"--site=lpsg").split("=")[1];
const profilePath=path.join(here,"sites",`${site}.json`);
if(!fs.existsSync(profilePath)) throw new Error(`Unknown media-gallery site: ${site}`);
const profile=JSON.parse(fs.readFileSync(profilePath,"utf8"));
const root=path.resolve(here,profile.builderRoot);
const modules=JSON.parse(fs.readFileSync(path.join(root,"modules.json"),"utf8"));
const output=modules.map(name=>fs.readFileSync(path.join(root,"src",name),"utf8")).join("");
const target=path.resolve(here,profile.output);
if(process.argv.includes("--check")) {
  if(!fs.existsSync(target)||fs.readFileSync(target,"utf8")!==output){console.error(`${profile.label} media-gallery output is stale.`);process.exit(1)}
  console.log(`${profile.label} media-gallery output is reproducible.`);
} else { fs.mkdirSync(path.dirname(target),{recursive:true}); fs.writeFileSync(target,output); console.log(`Built ${target}`); }
