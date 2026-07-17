import { Namer } from '@parcel/plugin';

const NAMES = {
  css: 'styles.css',
  js: 'scripts.js'
};

export default new Namer({
  /**
   * Emits fixed asset names in production builds only. Dev mode emits extra
   * JS bundles (HMR runtime) that would collide on a fixed name, so it opts
   * out entirely. Returning `null` falls through to the default namer
   * (e.g. index.html).
   *
   * @param {{bundle: import('@parcel/types').Bundle, options: import('@parcel/types').PluginOptions}} params
   * @returns {string | null} Fixed name for the bundle, or `null` to defer
   */
  name({ bundle, options }) {
    if (options.mode !== 'production') return null;
    return NAMES[bundle.type] ?? null;
  }
});
