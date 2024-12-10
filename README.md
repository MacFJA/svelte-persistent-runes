# Svelte persistent runes

A Svelte reactive rune that keep its value through pages and reloads

![GitHub Repo stars](https://img.shields.io/github/stars/macfja/svelte-persistent-store?style=social)
![NPM bundle size](https://img.shields.io/bundlephobia/minzip/@macfja/svelte-persistent-store)
![Download per week](https://img.shields.io/npm/dw/@macfja/svelte-persistent-store)
![License](https://img.shields.io/npm/l/@macfja/svelte-persistent-store)
![NPM version](https://img.shields.io/npm/v/@macfja/svelte-persistent-store)
[![Checked with Biome](https://img.shields.io/badge/Checked_with-Biome-60a5fa?style=flat&logo=biome)](https://biomejs.dev)

[ **[D E M O](https://www.sveltelab.dev/5aypljhy6qtirvp)** ]

## Installation

With [NPM](https://www.npmjs.com/package/@macfja/svelte-persistent-runes)
```sh
npm install --save-dev @macfja/svelte-persistent-runes
# or
yarn add --save-dev @macfja/svelte-persistent-runes
# or
pnpm add --save-dev @macfja/svelte-persistent-runes
# or
deno install --dev npm:@macfja/svelte-persistent-runes
```

## Quickstart

Update your `./svelte.config.js` to add a new preprocessor:
```diff
 import adapter from '@sveltejs/adapter-auto';
+import persist from "@macfja/svelte-persistent-runes/preprocessor"
 const config = {
+ 	preprocess: [persist()],
	kit: {
		adapter: adapter()
	}
 };
 export default config;
```

Update your `/src/app.d.ts` to add the following import to prevent TypeScript from complaining about the unknown function `$persist`:
> 
```diff
+import "@macfja/svelte-persistent-runes"
```


Replace your `$state` with `$persist`:
```diff
 <script>
-let count = $state(0);
+let count = $persist(0, 'counter');
 </script>
```

## Usage

This library have 2 parts:
- A preprocessor to add the `$persist` rune.
- A set of configuration to persist your data.

You MUST add the preprocessor to use `$persist`.
It's as simple as to add it in your Svelte configuration (`svelte.config.js`) with the import of `@macfja/svelte-persistent-runes/preprocessor`

<details>
<summary>./svelte.config.js</summary>

```js
import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import persist from "@macfja/svelte-persistent-runes/preprocessor"

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: [vitePreprocess(), persist()],
	kit: {
		adapter: adapter()
	}
};

export default config;
```

</details>

Now that the preprocessor is added, you can use the `$persist` rune instead of the `$state` rune.

<details>
<summary>./src/anywhere/component.svelte</summary>

```html
<script>
let count = $persist(0, 'counter');
</script>
<div class="counter">
    <button onclick={() => (count -= 1)} aria-label="Decrease the counter by one">-</button>
    <div><strong>{count}</strong></div>
    <button onclick={() => (count += 1)} aria-label="Increase the counter by one">+</button>
</div>
```

</details>

<details>
<summary>./src/anywhere/data.svelte.ts</summary>

```ts
export class Person {
    name = $persist('John', 'user-name')
    age = $persist(33, 'user-age')
    
    greet(): string {
        return `Hello ${this.name}`;
    }
    birthday(): string {
        this.age += 1;
        return `Happy birthday ${this.name}!`
    }
}
export const currentUser = new Person()
```

</details>

### Definition

```ts
type PersistentRunesOptions = {
    /**
     * Convert the source data into its string representation
     * @param input The source data
     * @return The string representation of data
     */
    serialize<T>(input: T): string;
    /**
     * Convert back the string representation into the source data
     * @param input The string representation of the date
     * @return The new data based on its string representation
     */
    deserialize<T>(input: string): T;
    /**
     * Write data into the store
     * @param key The storage key to write
     * @param value The data to write
     */
    storageWrite(key: string, value: string): void;
    /**
     * Read data from the storage
     * @param key The storage key to read
     * @returns The data or `undefined` if the data don't exist in the storage
     */
    storageRead(key: string): string | undefined;
};

/**
 * A reactive state, that can restore its state upon page reload
 * @param initial The initial value of the state
 * @param key The storage key of the state. Must be unique in your application
 * @param options The persistence options (how and where)
 */
declare function $persist<T>(initial: T, key: string, options?: Partial<PersistentRunesOption>)
```

### Options

You can customize how and where the state value is persisted.

The `$persist` runes take a third (and optional) parameter of type `PersistentRunesOption`.

The options consist of 2 main part: the serializer and the storage. It can be defined as a plain object or as the result of the `buildOptions` (impoerted from `@macfja/svelte-persistent-runes/options`)

```ts
/**
 * Create a `PersistentRunesOptions` from a serializer and a storage
 * @param serializer The serializer to use (if `undefined` then `JsonSerializer` will be used)
 * @param storage The storage to use (if `undefined` then `BrowserLocalStorage` will be used)
 */
declare function buildOptions(
    serializer: PersistentRunesSerializer | undefined, 
    storage: PersistentRunesStorage | undefined
): PersistentRunesOptions;
```


#### The serializer

The serializer part of the option are:
 - `serialize`: This function is responsible for converting the original type into a string
 - `deserialize`: This function is responsible to convert back a string to the original type

The library have several built-in serializer:
 - `JsonSerializerFactory`: factory to create a JSON based serializer
   - `JsonSerializer`: A basic JSON serializer (no replacer, nor reviver)
 - `DevalueSerializerFactory`: factory to create a [Devalue] based serializer
   - `DevalueSerializer`: A basic [Devalue] serializer (no reducers, nor revivers)
 - `ESSerializerSerializerFactory`: factory to create a [ESSerializer] based serializer
   - `ESSerializerSerializer`: A basic [ESSerializer] serializer (no SerializeOptions, nor classes)
 - `MacfjaSerializerFactory`: factory to create a [@macfja/serializer] based serializer
   - `MacfjaSerializer`: A basic [@macfja/serializer] serializer (no additional classes mapping)
 - `SuperJsonSerializer`: A [superjson] serializer
 - `NextJsonSerializerFactory`: factory to create a [next-json] based serializer
   - `NextJsonSerializerFactory`: A basic [next-json] serializer (no options, nor replacers, nor revivers)

[ESSerializer]: https://www.npmjs.com/package/esserializer
[Devalue]: https://www.npmjs.com/package/devalue
[@macfja/serializer]: https://www.npmjs.com/package/@macfja/serializer
[superjson]: https://www.npmjs.com/package/superjson
[next-json]: https://www.npmjs.com/package/next-json

#### The storage

The storage part of the option are:
 - `storageWrite`: This function is responsible to write data into the storage
 - `storageRead`: This function is responsible to read data from the storage

The library have several built-in storage:
- `BrowserCookieStorageFactory`: factory to create a Cookie based storage (DOM API, browser only)
   - `BrowserCookieStorage`: A basic Cookie storage (no particular options, except for `samesite: Strict`)
- `BrowserLocalStorage`: a browser localStorage storage ([DOM API](https://developer.mozilla.org/en-US/docs/Web/API/Storage), browser only)
- `BrowserSessionStorage`: a browser sessionStorage storage ([DOM API](https://developer.mozilla.org/en-US/docs/Web/API/Storage), browser only)
- `addEncryptionStorage`: a wrapper function to add AES [GCM encryption] on stored data

[GCM encryption]: https://en.wikipedia.org/wiki/Galois/Counter_Mode

#### Example

<details>

<summary>Browser session storage and @macfja/serializer</summary>

```html
<script>
import { buildOptions, MacfjaSerializer, BrowserSessionStorage } "@macfja/svelte-persistent-runes/options"
let count = $persist(0, 'counter', buildOptions(MacfjaSerializer, BrowserSessionStorage));
</script>
<div class="counter">
    <button onclick={() => (count -= 1)} aria-label="Decrease the counter by one">-</button>
    <div><strong>{count}</strong></div>
    <button onclick={() => (count += 1)} aria-label="Increase the counter by one">+</button>
</div>
```

</details>

<details>

<summary>Browser local storage, encrypted and SuperJson </summary>

```html
<script>
import { buildOptions, SuperJsnoSerializer, BrowserLocalStorage, addEncryptionStorage } "@macfja/svelte-persistent-runes/options"
let count = $persist(0, 'counter', buildOptions(SuperJsnoSerializer, addEncryptionStorage(BrowserLocalStorage, '12345678901234567890123456879012'));
</script>
<div class="counter">
    <button onclick={() => (count -= 1)} aria-label="Decrease the counter by one">-</button>
    <div><strong>{count}</strong></div>
    <button onclick={() => (count += 1)} aria-label="Increase the counter by one">+</button>
</div>
```

</details>
