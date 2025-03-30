module "serialize-anything" {
	function serialize(
		// biome-ignore lint/suspicious/noExplicitAny: Original type
		source: any,
		options?: {
			maxDepth?: number;
			pretty?: boolean;
		},
	);
	// biome-ignore lint/suspicious/noExplicitAny: Original type
	function deserialize(source: string): any;
}
