# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- Class that don't only contains `$persist` are not transformed
- `.svelte.ts`/`.svelte.js` file not transformed ([Issue#2])
- Unit test are not up to date with the code

### Added

- New serializer ([php-serialize](https://www.npmjs.com/package/php-serialize))
- New serializer ([serialize-anything](https://www.npmjs.com/package/serialize-anything))
- Add a new Vite plugin to handle svelte module (`.svelte.ts`/`.svelte.js` file) ([Issue#2])

### Deprecated

- Deprecate the default import of `@macfja/svelte-persistent-runes/preprocessor`

## [1.0.0]

First version

[unreleased]: https://github.com/MacFJA/svelte-persistent-runes/compare/1.0.0...HEAD
[1.0.0]: https://github.com/MacFJA/svelte-persistent-runes/releases/tag/1.0.0

[Issue#2]: https://github.com/MacFJA/svelte-persistent-runes/issues/2
