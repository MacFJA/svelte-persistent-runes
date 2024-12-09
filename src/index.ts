import { buildOptions } from "./options";

export type PersistentRunesOptions = {
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

declare global {
	/**
	 * A reactive state, that can restore its state upon page reload
	 * @param initial The initial value of the state
	 * @param key The storage key of the state. Must be unique in your application
	 * @param options The persistence options (how and where)
	 */
	export function $persist<T>(
		initial: T,
		key: string,
		options?: Partial<PersistentRunesOptions>,
	): T;
}

export function load<T>(
	key: string,
	options?: Partial<PersistentRunesOptions>,
): T | undefined {
	const config = { ...buildOptions(undefined, undefined), ...options };
	const raw = config.storageRead(key);
	if (typeof raw !== "string") {
		return undefined;
	}
	return config.deserialize(raw);
}

export function save<T>(
	key: string,
	value: T,
	options?: Partial<PersistentRunesOptions>,
): void {
	if (value === undefined) {
		return;
	}
	const config = { ...buildOptions(undefined, undefined), ...options };

	const serialized = config.serialize(value);
	config.storageWrite(key, serialized);
}
