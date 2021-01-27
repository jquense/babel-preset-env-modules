# babel-preset-env-modules

A babel preset configured for minimal compiled output in environements that
support ESM (but not limited to), with polyfill support.

This is a light wrapper around `@babel/preset-env` and `babel-polyfill-corejs3`
that handles trickies gotcha's that arise when using these presets naively.

## Usage

The preset accepts all options of `@babel/preset-env` **except** those related to polyfilling: `corejs`, `useBuiltIns`, and adds an `exclude` for polyfills. Polyfilling is handled by `babel-polyfill-corejs3` and
can be configured via the `polyfill` option.

Below are options with their defaults:

```js
{
  presets: [
    [
      'babel-preset-env-modules',
      {
        loose: true,
        development: false,
        targets: { esmodules: true },
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

        // see `babel-polyfill-corejs3` options for valid options
        polyfill: false,
      },
    ],
  ]
}
```

As with preset-env, the browser targets are determined via a browserlistrc or similar if present.
You can explicitly set them as well. Targets are shared with `babel-polyfill-corejs3` automatically.

## What does this handle?

A few things!

### Prevents supported builtin's from being included

preset-env conflates it's concept of "built ins" to mean both: "things your code is using that need polyfills" and
"Helpers we include for generated code". Basically when you don't enable `useBuiltIns`
you end up with helpers that your environement doesn't need. For instance, it will insert an
`_extends` helper instead of of using `Object.assign`. If you turn on `useBuiltIns`, it will use
`Object.assign`, however, it will also start polyfilling methods that _aren't_ supported, which
is undesirable in libraries.

`preset-env-modules` handles this case gracefully by enabling built0ins and then manually
excluding all polyfills.

### Handles polyfilling more accurately

We use, the newer https://github.com/babel/babel-polyfills core-js plugin to get
finer grained polyfills than what preset-env provides out of the box. preset-env-modules
handles the slightly tricky coordination between the plugin and preset to prevent
over polyfilling or conflicts between the two

### Excludes some largely unnecessary polyfills by default

Core.js Is very thorough in it's polyfilling, handling even niche bugs in older browsers, and strict spec compliance.
Some enviroments may need these covered, but in practice we've found there are a set
of universally included polyfills for Array and Object methods that bloat the output code to
handle rare edge cases. As an example, many array methods are reimplemented to support the newer [`Symbol.species`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/species) which very uncommonly depended on. By default we exclude these polyfills to save bytes sort of
like a polyfill "loose" mode. You can enable them if you need them!
