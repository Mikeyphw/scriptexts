import fs from "node:fs"; import path from "node:path"; import { fileURLToPath } from "node:url";
const here=path.dirname(fileURLToPath(import.meta.url)); const root=path.resolve(here,"../..");
const out=path.join(root,"standalone/poast-timeline-metadata-reset/poast-timeline-metadata-reset.user.js");
const read=n=>fs.readFileSync(path.join(here,"src",n),"utf8");
const built=read("header.js")+"  const css = `"+read("styles.css").trimEnd()+"\n`;\n"+read("runtime.js");
if(process.argv.includes("--check")){ if(fs.readFileSync(out,"utf8")!==built){console.error("Poast generated output is stale");process.exit(1)} } else fs.writeFileSync(out,built);
