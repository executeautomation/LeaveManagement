// metro.config.js
// https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');
const path = require('node:path');

const config = getDefaultConfig(__dirname);

// `expo-sqlite`'s web build references a `.wasm` file (./wa-sqlite/wa-sqlite.wasm)
// that the default Metro web resolver can't handle, and Metro walks the dep-graph
// even for lazy `require()`s. So on web we replace the package entirely with a
// pure-JS in-memory shim. iOS/Android are left untouched — they resolve through
// normal platform fields to the real `expo-sqlite` native module.
//
// We redirect using `MainEntry` (an absolute path) so the resolution is
// independent of the importer's directory.
const WEB_SHIM = path.resolve(__dirname, 'src/lib/expo-sqlite.web-shim.ts');

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName === 'expo-sqlite') {
    return { type: 'sourceFile', filePath: WEB_SHIM };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
