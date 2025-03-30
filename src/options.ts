import {
	type CookieOptions,
	get as getCookie,
	set as setCookie,
} from "browser-cookies";
// @ts-ignore
import toHex from "sjcl-codec-hex/from-bits";
// @ts-ignore
import fromHex from "sjcl-codec-hex/to-bits";
// @ts-ignore
import sjcl from "sjcl-es";
import * as superjson from "superjson";
import type { PersistentRunesOptions } from "./index";
import {
	DevalueSerializerFactory,
	ESSerializerSerializerFactory,
	JsonSerializerFactory,
	MacfjaSerializerFactory,
	NextJsonSerializerFactory,
	PhpSerializeSerializerFactory,
	SerializeAnythingSerializerFactory,
} from "./serializer-factory";

export type PersistentRunesStorage = Pick<
	PersistentRunesOptions,
	"storageWrite" | "storageRead"
>;
export type PersistentRunesSerializer = Pick<
	PersistentRunesOptions,
	"serialize" | "deserialize"
>;

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
export const PhpSerializeSerializer: PersistentRunesSerializer =
	PhpSerializeSerializerFactory();
export const SerializeAnythingSerializer: PersistentRunesSerializer =
	SerializeAnythingSerializerFactory();

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

export * from "./serializer-factory";
