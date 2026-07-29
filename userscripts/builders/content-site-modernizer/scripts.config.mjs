import aiptComics from './src/profiles/aipt-comics.mjs';
import bleedingCool from './src/profiles/bleeding-cool.mjs';
import menOfPorn from './src/profiles/menofporn.mjs';
import putinho from './src/profiles/putinho.mjs';
import gayteam from './src/profiles/gayteam.mjs';
import justTheGays from './src/profiles/justthegays.mjs';
import str8upGayPorn from './src/profiles/str8upgayporn.mjs';

export const builder = {
  id: 'content-site-modernizer',
  name: 'Content Site Modernizer',
  distDir: 'dist',
  scripts: [aiptComics, bleedingCool, menOfPorn, putinho, gayteam, justTheGays, str8upGayPorn]
};

export default builder;
