#!/usr/bin/env python3
from __future__ import annotations
import hashlib, json, re, stat, zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
TARGETS=("stardew-nexus-download-queue","telegram-media-downloader")
TS=(1980,1,1,0,0,0); MODE=(stat.S_IFREG|0o644)<<16

def info(name):
 i=zipfile.ZipInfo(name,TS); i.compress_type=zipfile.ZIP_DEFLATED; i.create_system=3; i.external_attr=MODE; i.flag_bits|=0x800; return i

def mv3(m):
 m=dict(m); m['manifest_version']=3
 perms=[]; hosts=[]
 for p in m.get('permissions',[]):
  (hosts if '://' in p else perms).append(p)
 m['permissions']=perms
 if hosts: m['host_permissions']=hosts
 ba=m.pop('browser_action',None)
 if ba: m['action']=ba
 bg=m.get('background',{}); scripts=bg.get('scripts',[])
 if scripts: m['background']={'service_worker':'background.js'}
 m.pop('browser_specific_settings',None)
 war=m.get('web_accessible_resources')
 if war and war and isinstance(war[0],str):
  matches=sorted(set(sum([c.get('matches',[]) for c in m.get('content_scripts',[])],[])))
  m['web_accessible_resources']=[{'resources':war,'matches':matches}]
 return m,scripts

def transform(rel,data,scripts):
 if rel=='manifest.json': return data
 if rel.suffix=='.js':
  text=data.decode('utf-8').replace('browser.','chrome.')
  if rel.as_posix()=='background.js' and scripts:
   imports=[s for s in scripts if s!='background.js']
   if imports: text='importScripts('+','.join(json.dumps(s) for s in imports)+');\n'+text
  return text.encode()
 return data

def build(name):
 root=ROOT/'extensions'/name; src=root/'src'; dist=root/'dist'; m=json.loads((src/'manifest.json').read_text()); cm,scripts=mv3(m); version=m['version']; out=dist/f'{name}-{version}.chromium.zip'
 for old in dist.glob('*.chromium.zip'): old.unlink()
 with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
  for p in sorted(x for x in src.rglob('*') if x.is_file()):
   rel=p.relative_to(src); data=(json.dumps(cm,indent=2)+'\n').encode() if rel.as_posix()=='manifest.json' else transform(rel,p.read_bytes(),scripts)
   z.writestr(info(rel.as_posix()),data,compress_type=zipfile.ZIP_DEFLATED,compresslevel=9)
 return out

def main():
 for n in TARGETS:
  p=build(n); print('built',p.relative_to(ROOT))
if __name__=='__main__': main()
