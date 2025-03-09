import { persistPreprocessor } from "./plugins";

export default function () {
	console.warn(
		"[WARN] The import of default of `@macfja/svelte-persistent-runes/preprocessor` is deprecated,\n       use `persistPreprocessor` of import `@macfja/svelte-persistent-runes/plugins`",
	);
	return persistPreprocessor();
}
