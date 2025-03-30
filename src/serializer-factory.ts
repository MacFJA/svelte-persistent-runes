import * as macfja from "@macfja/serializer";
import * as dv from "devalue";
import ESSerializer from "esserializer";
import { NJSON } from "next-json";
import * as PhpSerialize from "php-serialize";
import SerAny from "serialize-anything";
import type { PersistentRunesSerializer } from "./options";

export function PhpSerializeSerializerFactory(options?: {
	givenOptions?: Parameters<typeof PhpSerialize.serialize>[2];
	scope?: Parameters<typeof PhpSerialize.serialize>[1];
}): PersistentRunesSerializer {
	return {
		deserialize<T>(input: string): T {
			return PhpSerialize.unserialize(
				input,
				options?.scope,
				options?.givenOptions,
			);
		},
		serialize<T>(input: T): string {
			return PhpSerialize.serialize(
				input,
				options?.scope,
				options?.givenOptions,
			);
		},
	};
}

export function SerializeAnythingSerializerFactory(options?: {
	maxDepth?: number;
	pretty?: boolean;
}): PersistentRunesSerializer {
	return {
		deserialize<T>(input: string): T {
			return SerAny.deserialize(input);
		},
		serialize<T>(input: T): string {
			return SerAny.serialize(input, options);
		},
	};
}

export function JsonSerializerFactory(options?: {
	replacer?: Parameters<typeof JSON.stringify>[1];
	reviver?: Parameters<typeof JSON.parse>[1];
	space?: Parameters<typeof JSON.stringify>[2];
}): PersistentRunesSerializer {
	return {
		serialize<T>(input: T): string {
			return JSON.stringify(input, options?.replacer, options?.space);
		},
		deserialize<T>(input: string): T {
			return JSON.parse(input, options?.reviver) as T;
		},
	};
}

export function DevalueSerializerFactory(options?: {
	reducers?: Parameters<typeof dv.stringify>[1];
	revivers?: Parameters<typeof dv.parse>[1];
}): PersistentRunesSerializer {
	return {
		serialize<T>(data: T): string {
			return dv.stringify(data, options?.reducers);
		},
		deserialize<T>(input: string): T {
			return dv.parse(input, options?.revivers);
		},
	};
}

export function ESSerializerSerializerFactory(options?: {
	serializeOption?: Parameters<typeof ESSerializer.serialize>[1];
	classes?: Parameters<typeof ESSerializer.deserialize>[1];
}): PersistentRunesSerializer {
	return {
		serialize<T>(data: T): string {
			return ESSerializer.serialize(data, options?.serializeOption);
		},
		deserialize<T>(input: string): T {
			return ESSerializer.deserialize(input, options?.classes);
		},
	};
}
export function MacfjaSerializerFactory(options?: {
	allowedClasses?: Parameters<typeof macfja.deserialize>[1];
}): PersistentRunesSerializer {
	return {
		serialize<T>(data: T): string {
			return macfja.serialize(data);
		},
		deserialize<T>(input: string): T {
			return macfja.deserialize(input, options?.allowedClasses);
		},
	};
}
export function NextJsonSerializerFactory(options?: {
	stringifyOptionsOrReplacer?: Parameters<typeof NJSON.stringify>[1];
	space?: Parameters<typeof NJSON.stringify>[2];
	parseOptionsOrReviver?: Parameters<typeof NJSON.parse>[1];
}): PersistentRunesSerializer {
	return {
		serialize<T>(data: T): string {
			return NJSON.stringify(
				data,
				options?.stringifyOptionsOrReplacer,
				options?.space,
			);
		},
		deserialize<T>(input: string): T {
			return NJSON.parse(input, options?.parseOptionsOrReviver);
		},
	};
}
