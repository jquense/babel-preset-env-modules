const path = require('path')
const pick = require('lodash/pick')
const { loadConfig } = require('browserslist')

const PRESET_ENV_OPTIONS = [
  'targets',
  'spec',
  'loose',
  'modules',
  'debug',
  'bugfixes',
  'include',
  'exclude',
  'useBuiltIns',
  'corejs',
  'forceAllTransforms',
  'configPath',
  'ignoreBrowserslistConfig',
  'shippedProposals',
]

// XXX: These are polyfills that get included, even in modern browsers due to small bugs
// in their implementations. It's relatively unlikely that these bugs will case an issue
// so the savings of excluding them proactively is probably worth it.
const loosePolyfills = [
  /^es\.promise$/,
  /^es\.array\.iterator/,
  /^es\.array\.sort/,
  /^es\.array\.splice/,
  /^es\.array\.slice/,
  /^es\.array\.index-of/,
  /^es\.array\.reverse/,
  /^es\.array\.last-index-of/,
  /^es\.object\.assign/,
  /^es\.array\.iterator/,
  /^es\.string\.match/,
  /^es\.string\.replace/,
  // this is always added and never used
  /^web\.dom-collections/,
]

function getTargets({
  development,
  targets,
  configPath,
  ignoreBrowserslistConfig,
}) {
  if (development) {
    return { esmodules: true }
  }

  if (
    ignoreBrowserslistConfig ||
    !loadConfig({ path: path.resolve(configPath) })
  ) {
    return targets || { esmodules: true }
  }

  // We don't run browserslist b/c that would require doing a bunch of
  // additional transforms to get the output in a format preset-env would
  // accept.
  return targets || undefined
}

function addDefaultOptions(explicitOptions) {
  const options = {
    development: false,
    targets: undefined,
    spec: false,
    loose: true,
    bugfixes: true,
    modules: 'commonjs',
    debug: false,
    include: [],
    exclude: [],

    configPath: '.',
    forceAllTransforms: false,
    ignoreBrowserslistConfig: false,
    shippedProposals: true,

    polyfill: false,
    corejs: false,
    ...explicitOptions,
  }

  options.targets = getTargets(options)

  const { polyfill } = options

  if (polyfill) {
    // e.g `{ polyfill: 'usage-global' }`
    const explicitPolyfill =
      typeof options.polyfill === 'string'
        ? { method: options.polyfill }
        : options.polyfill

    options.polyfill = {
      ignoreBrowserslistConfig: options.ignoreBrowserslistConfig,
      method: 'usage-global',
      shippedProposals: options.shippedProposals,
      targets: options.targets,
      ...explicitPolyfill,
    }
  }

  // Why are we setting these? WELL, useBuiltIns does two things:
  //
  // - Adds corejs polyfills for detected features
  // - Uses native API's for runtime (helper) code
  //
  // We want the latter behavior so that things like `_extends` aren't added to the
  // code when Object.assign is supported for all browsers. HOWEVER, we DO NOT
  // want preset-env to include polyfills for these, that is handled (if requested)
  // by `polyfill`. SO we enable useBuiltIns, but exclude ALL polyfills from
  // the transforms so they aren't added.
  options.corejs = 3
  options.useBuiltIns = 'usage'
  options.exclude.push(/^(es|es6|es7|esnext|web)\./)

  return options
}

function preset(api, explicitOptions = {}) {
  const options = addDefaultOptions(explicitOptions)
  const { development } = options

  return {
    presets: [
      [require('@babel/preset-env'), pick(options, PRESET_ENV_OPTIONS)],
    ],
    plugins: [
      options.polyfill && [
        require('babel-plugin-polyfill-corejs3'),
        {
          exclude: loosePolyfills,
          version: '3.100', // a very high minor to ensure it's using any v3
          ...options.polyfill,
        },
      ],
    ].filter(Boolean),
  }
}

module.exports = preset
