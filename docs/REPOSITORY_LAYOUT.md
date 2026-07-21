# Repository layout

## Userscripts

`userscripts/standalone/` contains direct single-file userscripts. These files are the editable source and the install artifact.

`userscripts/builders/` contains generated userscript projects. Their `dist/*.user.js` files are install artifacts, while `src/` and the builder files are the source of truth.

## Extensions

`extensions/<project-slug>/src/` contains editable Firefox extension source. `extensions/<project-slug>/dist/` contains rebuilt unsigned XPIs generated from source. Uploaded or upstream ZIP/XPI snapshots are not retained as separate source material.

## Names

Directory and file names use lowercase kebab-case. Product names remain human-readable in userscript metadata and extension manifests.
