import def, { type ExecutionContext, type TestFn } from "ava";
import { persistPreprocessor } from "./plugins";

const test: TestFn = def as unknown as TestFn;

test("Transform variable", async (t: ExecutionContext) => {
	const input = "let name = $persist('John', 'name');";
	const actual = await persistPreprocessor().script?.({
		content: input,
		filename: "test.js",
		attributes: {},
		markup: "",
	});

	t.is(
		actual?.code,
		`import * as dyn___persistent_runes from "@macfja/svelte-persistent-runes";

let name = $state(dyn___persistent_runes.load('name', undefined) ?? 'John');
$effect.root(() => {$effect(() => dyn___persistent_runes.save('name', $state.snapshot(name), undefined))});`,
	);
	t.is(
		actual?.map,
		'{"version":3,"sources":["test.js"],"names":[],"mappings":";;UAAU","file":"test.js","sourcesContent":["let name = $persist(\'John\', \'name\');"]}',
	);
});
test("Transform variable with options", async (t: ExecutionContext) => {
	const input =
		"let name = $persist('John', 'name', {serialize: (v) => JSON.stringify(v)});";
	const actual = await persistPreprocessor().script?.({
		content: input,
		filename: "test.js",
		attributes: {},
		markup: "",
	});
	t.is(
		actual?.code,
		`import * as dyn___persistent_runes from "@macfja/svelte-persistent-runes";

let name = $state(dyn___persistent_runes.load('name', { serialize: (v) => JSON.stringify(v) }) ?? 'John');
$effect.root(() => {$effect(() => dyn___persistent_runes.save('name', $state.snapshot(name), { serialize: (v) => JSON.stringify(v) }))});`,
	);

	t.is(
		actual?.map,
		'{"version":3,"sources":["test.js"],"names":[],"mappings":";;UAAU","file":"test.js","sourcesContent":["let name = $persist(\'John\', \'name\', {serialize: (v) => JSON.stringify(v)});"]}',
	);
});

test("Transform class", async (t: ExecutionContext) => {
	const input = "class Test { name = $persist('John', 'name'); }";
	const actual = await persistPreprocessor().script?.({
		content: input,
		filename: "test.js",
		attributes: {},
		markup: "",
	});
	t.is(
		actual?.code,
		`import * as dyn___persistent_runes from "@macfja/svelte-persistent-runes";

class Test { name = $state(dyn___persistent_runes.load('name', undefined) ?? 'John');

    constructor() {
        $effect.root(() => {$effect(() => dyn___persistent_runes.save('name', $state.snapshot(this.name), undefined))});
    }
 }`,
	);

	t.is(
		actual?.map,
		'{"version":3,"sources":["test.js"],"names":[],"mappings":";;mBAAmB","file":"test.js","sourcesContent":["class Test { name = $persist(\'John\', \'name\'); }"]}',
	);
});
test("Transform class with several props", async (t: ExecutionContext) => {
	const input = `class Test {
  name = $persist('John', 'name');
  age = $persist(0, 'user-age');
}`;
	const actual = await persistPreprocessor().script?.({
		content: input,
		filename: "test.js",
		attributes: {},
		markup: "",
	});
	t.is(
		actual?.code,
		`import * as dyn___persistent_runes from "@macfja/svelte-persistent-runes";

class Test {
  name = $state(dyn___persistent_runes.load('name', undefined) ?? 'John');
  age = $state(dyn___persistent_runes.load('user-age', undefined) ?? 0);

    constructor() {
        $effect.root(() => {$effect(() => dyn___persistent_runes.save('name', $state.snapshot(this.name), undefined))
        $effect(() => dyn___persistent_runes.save('user-age', $state.snapshot(this.age), undefined))});
    }
}`,
	);
});
test("Transform class with parent", async (t: ExecutionContext) => {
	const input = "class Test extends Base { name = $persist('John', 'name'); }";
	const actual = await persistPreprocessor().script?.({
		content: input,
		filename: "test.js",
		attributes: {},
		markup: "",
	});
	t.is(
		actual?.code,
		`import * as dyn___persistent_runes from "@macfja/svelte-persistent-runes";

class Test extends Base { name = $state(dyn___persistent_runes.load('name', undefined) ?? 'John');

    constructor(...args: any[]) {
        super(...args);
        $effect.root(() => {$effect(() => dyn___persistent_runes.save('name', $state.snapshot(this.name), undefined))});
    }
 }`,
	);
});
test("Transform class with constructor", async (t: ExecutionContext) => {
	const input =
		"class Test { name = $persist('John', 'name'); constructor() { console.log('test'); } }";
	const actual = await persistPreprocessor().script?.({
		content: input,
		filename: "test.js",
		attributes: {},
		markup: "",
	});
	t.is(
		actual?.code,
		`import * as dyn___persistent_runes from "@macfja/svelte-persistent-runes";

class Test { name = $state(dyn___persistent_runes.load('name', undefined) ?? 'John'); constructor() { console.log('test');
    $effect.root(() => {$effect(() => dyn___persistent_runes.save('name', $state.snapshot(this.name), undefined))}); } }`,
	);
});
