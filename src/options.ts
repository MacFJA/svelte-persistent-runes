import * as macfja from "@macfja/serializer";
import {
	type CookieOptions,
	get as getCookie,
	set as setCookie,
} from "browser-cookies";
import * as dv from "devalue";
import ESSerializer from "esserializer";
import { NJSON } from "next-json";
// @ts-ignore
import toHex from "sjcl-codec-hex/from-bits";
// @ts-ignore
import fromHex from "sjcl-codec-hex/to-bits";
// @ts-ignore
import sjcl from "sjcl-es";
import * as superjson from "superjson";
import type { PersistentRunesOptions } from "./index";

export type PersistentRunesStorage = Pick<
	PersistentRunesOptions,
	"storageWrite" | "storageRead"
>;
export type PersistentRunesSerializer = Pick<
	PersistentRunesOptions,
	"serialize" | "deserialize"
>;

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
export const SuperJsonSerializer: PersistentRunesSerializer = {
	serialize<T>(input: T): string {
		return superjson.stringify(input);
	},
	deserialize<T>(input: string): T {
		return superjson.parse(input) as T;
	},
};
export function BrowserCookieStorageFactory(
	cookieOptions?: CookieOptions,
): PersistentRunesStorage {
	return {
		storageWrite(key: string, value: string): void {
			setCookie(key, value, { samesite: "Strict", ...cookieOptions });
		},
		storageRead(key: string): string | undefined {
			return getCookie(key) || undefined;
		},
	};
}

export const BrowserLocalStorage: PersistentRunesStorage = {
	storageWrite(key: string, value: string) {
		globalThis?.window &&
			"localStorage" in globalThis.window &&
			globalThis.window.localStorage.setItem(key, value);
	},
	storageRead(key: string): string | undefined {
		return (
			(globalThis?.window &&
				"localStorage" in globalThis.window &&
				globalThis.window.localStorage.getItem(key)) ||
			undefined
		);
	},
};
export const BrowserSessionStorage: PersistentRunesStorage = {
	storageWrite(key: string, value: string) {
		globalThis?.window &&
			"sessionStorage" in globalThis.window &&
			globalThis.window.sessionStorage.setItem(key, value);
	},
	storageRead(key: string): string | undefined {
		return (
			(globalThis?.window &&
				"sessionStorage" in globalThis.window &&
				globalThis.window.sessionStorage.getItem(key)) ||
			undefined
		);
	},
};
export function addEncryptionStorage(
	onStorage: PersistentRunesStorage,
	encryptionKey: string,
	iv = "spr",
): PersistentRunesStorage {
	const cipher = new sjcl.cipher.aes(fromHex(encryptionKey));
	return {
		storageRead(key: string): string | undefined {
			const data = onStorage.storageRead(key);
			if (data === undefined) return undefined;
			return sjcl.codec.utf8String.fromBits(
				sjcl.mode.gcm.decrypt(
					cipher,
					fromHex(data.split(":")[0]),
					fromHex(data.split(":")[1]),
				),
			);
		},
		storageWrite(key: string, value: string): void {
			const encodedIv = sjcl.codec.utf8String.toBits(iv);
			const data = `${toHex(sjcl.mode.gcm.encrypt(cipher, sjcl.codec.utf8String.toBits(value), encodedIv, [], 256))}:${toHex(encodedIv)}`;
			onStorage.storageWrite(key, data);
		},
	};
}

export const BrowserCookieStorage = BrowserCookieStorageFactory();
export const JsonSerializer: PersistentRunesSerializer =
	JsonSerializerFactory();
export const DevalueSerializer: PersistentRunesSerializer =
	DevalueSerializerFactory();
export const ESSerializerSerializer: PersistentRunesSerializer =
	ESSerializerSerializerFactory();
export const MacfjaSerializer: PersistentRunesSerializer =
	MacfjaSerializerFactory();
export const NextJsonSerializer: PersistentRunesSerializer =
	NextJsonSerializerFactory();

/**
 * Create a `PersistentRunesOptions` from a serializer and a storage
 * @param serializer The serializer to use (if `undefined` then `JsonSerializer` will be used)
 * @param storage The storage to use (if `undefined` then `BrowserLocalStorage` will be used)
 */
export function buildOptions(
	serializer: PersistentRunesSerializer | undefined,
	storage: PersistentRunesStorage | undefined,
): PersistentRunesOptions {
	return {
		...(serializer ?? JsonSerializer),
		...(storage ?? BrowserLocalStorage),
	};
}
