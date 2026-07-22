import aiptComics from './src/profiles/aipt-comics.mjs';
import bleedingCool from './src/profiles/bleeding-cool.mjs';
import menOfPorn from './src/profiles/menofporn.mjs';

export const builder = {
  id: 'content-site-modernizer',
  name: 'Content Site Modernizer',
  distDir: 'dist',
  scripts: [aiptComics, bleedingCool, menOfPorn]
};

export default builder;
