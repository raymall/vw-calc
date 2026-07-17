import { Namer } from '@parcel/plugin';

const NAMES = {
  css: 'styles.css',
  js: 'scripts.js'
};

export default new Namer({
  name({ bundle, options }) {
    // dev mode emits extra JS bundles (HMR runtime) that would collide on a fixed name
    if (options.mode !== 'production') return null;
    // null falls through to the default namer (e.g. index.html)
    return NAMES[bundle.type] ?? null;
  }
});
