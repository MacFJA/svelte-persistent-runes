import { type Position, SourceMapGenerator } from "source-map";
import type { PreprocessorGroup } from "svelte/compiler";
import {
	Block,
	CallExpression,
	ClassDeclaration,
	Identifier,
	type Node,
	type OptionalKind,
	type ParameterDeclarationStructure,
	Project,
	StructureKind,
	SyntaxKind,
	VariableDeclaration,
} from "ts-morph";

type ToTrackData = {
	varname: string;
	key: string;
	options: string;
};
type PositionSize = Position & {
	lines: number;
};
type AddMapping = (
	original: PositionSize | undefined,
	generated: PositionSize,
) => void;

export default function persistRune(): PreprocessorGroup {
	return {
		script: ({ content, filename }) => {
			if (content.indexOf("$persist") === -1) {
				return {
					code: content,
				};
			}

			const sourceMap = new SourceMapGenerator({
				file: filename,
			});
			sourceMap.setSourceContent(filename ?? "tmp.js", content);
			let addLines = 0;
			const project = new Project({
				skipAddingFilesFromTsConfig: true,
				skipFileDependencyResolution: true,
				skipLoadingLibFiles: true,
				useInMemoryFileSystem: true,
			});

			const sourceFile = project.createSourceFile(
				filename ?? "tmp.js",
				content,
			);
			sourceFile.addImportDeclaration({
				kind: StructureKind.ImportDeclaration,
				moduleSpecifier: "@macfja/svelte-persistent-runes",
				namespaceImport: "dyn___persistent_runes",
			});
			addLines +=
				sourceFile.getFullText().split("\n").length -
				content.split("\n").length;
			const toTrackVar: Array<ToTrackData> = [];
			const addMapping: AddMapping = (original, generated) => {
				if (original) {
					sourceMap.addMapping({
						original: {
							column: original.column,
							line: original.line - addLines,
						},
						generated: {
							line: generated.line,
							column: generated.column,
						},
						source: filename ?? "tmp.js",
					});
				}
				addLines += generated.lines - (original?.lines ?? 0);
			};
			sourceFile.forEachDescendant((node) => {
				toTrackVar.push(...processVariable(node, addMapping));
				processClass(node, addMapping);
			});

			if (toTrackVar.length > 0) {
				const added = sourceFile.addStatements(
					`$effect.root(() => {${toTrackVar
						.map(({ varname, key, options }) => {
							return `$effect(() => dyn___persistent_runes.save(${key}, $state.snapshot(${varname}), ${options}))`;
						})
						.join("\n")}});`,
				);
				addMapping(undefined, {
					line: added[0].getStartLineNumber(false),
					column: 0,
					lines:
						added[0].getEndLineNumber() - added[0].getStartLineNumber(false),
				});
			}
			return { code: sourceFile.getFullText(), map: sourceMap.toString() };
		},
	};
}

function processVariable(
	node: Node,
	addMapping: AddMapping,
): Array<ToTrackData> {
	if (node.getKind() !== SyntaxKind.VariableDeclaration) {
		return [];
	}

	if (!(node instanceof VariableDeclaration)) {
		return [];
	}

	const left = node.getName();
	const right = node.getInitializer();

	if (right === undefined) {
		return [];
	}

	if (
		right.getKind() !== SyntaxKind.CallExpression ||
		!(right instanceof CallExpression)
	) {
		return [];
	}

	const expression = right.getExpression();
	if (
		expression.getKind() !== SyntaxKind.Identifier ||
		!(expression instanceof Identifier)
	) {
		return [];
	}

	if (expression.getFullText().trim() !== "$persist") {
		return [];
	}

	if (right.getArguments().length < 2) {
		return [];
	}

	const key = right.getArguments()[1]?.print();
	const initial = right.getArguments()[0]?.print();
	const options = right.getArguments()[2]?.print() ?? "undefined";
	const varname = left;
	const originalPos: PositionSize = {
		line: right.getStartLineNumber(false),
		column: right.getPos() - right.getStartLinePos(false),
		lines: right.getEndLineNumber() - right.getStartLineNumber(false),
	};
	node.setInitializer((writer) =>
		writer.write(
			`$state(dyn___persistent_runes.load(${key}, ${options}) ?? ${initial})`,
		),
	);
	const newInitializer = node.getInitializer();
	if (newInitializer) {
		addMapping(originalPos, {
			line: newInitializer.getStartLineNumber(false),
			column: newInitializer.getPos() - newInitializer.getStartLinePos(false),
			lines:
				newInitializer.getEndLineNumber() -
				newInitializer.getStartLineNumber(false),
		});
	}

	return [{ varname, key, options }];
}

function processClass(node: Node, addMapping: AddMapping): void {
	if (
		node.getKind() !== SyntaxKind.ClassDeclaration ||
		!(node instanceof ClassDeclaration)
	) {
		return;
	}

	const properties: Array<ToTrackData> = [];

	for (const content of node.getProperties()) {
		const left = content.getName();
		const right = content.getInitializer();

		if (
			right?.getKind() !== SyntaxKind.CallExpression ||
			!(right instanceof CallExpression)
		) {
			return;
		}
		const expression = right.getExpression();
		if (
			expression.getKind() !== SyntaxKind.Identifier ||
			!(expression instanceof Identifier)
		) {
			return;
		}
		if (expression.getFullText().trim() !== "$persist") {
			return;
		}
		if (right.getArguments().length < 2) {
			return;
		}

		const key = right.getArguments()[1].print();
		const initial = right.getArguments()[0].print();
		const varname = left;
		const options = right.getArguments()[2]?.print() ?? "undefined";
		const originalPos: PositionSize = {
			line: right.getStartLineNumber(false),
			column: right.getPos() - right.getStartLinePos(false),
			lines: right.getEndLineNumber() - right.getStartLineNumber(false),
		};
		content.setInitializer((writer) =>
			writer.write(
				`$state(dyn___persistent_runes.load(${key}, ${options}) ?? ${initial})`,
			),
		);
		const newInitializer = content.getInitializer();
		if (newInitializer) {
			addMapping(originalPos, {
				line: newInitializer.getStartLineNumber(false),
				column: newInitializer.getPos() - newInitializer.getStartLinePos(false),
				lines:
					newInitializer.getEndLineNumber() -
					newInitializer.getStartLineNumber(false),
			});
		}

		properties.push({ varname, key, options });
	}

	for (const content of node.getConstructors()) {
		const body = content.getBody();
		if (body === undefined || !(body instanceof Block)) {
			continue;
		}

		body.addStatements(
			`$effect.root(() => {${properties
				.map(({ varname, key, options }) => {
					return `$effect(() => dyn___persistent_runes.save(${key}, $state.snapshot(this.${varname}), ${options}))`;
				})
				.join("\n")}});`,
		);
		addMapping(undefined, {
			line: body.getStartLineNumber(false),
			column: body.getPos() - body.getStartLinePos(false),
			lines: body.getEndLineNumber() - body.getStartLineNumber(false),
		});

		return;
	}

	const superClass = !!node.getExtends();

	node.addConstructor({
		parameters: [
			superClass && {
				isRestParameter: true,
				name: "args",
				type: "any[]",
			},
		].filter(Boolean) as OptionalKind<ParameterDeclarationStructure>[],
		statements: (writer) => {
			if (superClass) {
				writer.writeLine("super(...args);");
			}
			writer.write(
				`$effect.root(() => {${properties
					.map(({ varname, key, options }) => {
						return `$effect(() => dyn___persistent_runes.save(${key}, $state.snapshot(this.${varname}), ${options}))`;
					})
					.join("\n")}});`,
			);
		},
	});
	const newConstructor = node.getConstructors()[0];
	addMapping(undefined, {
		line: newConstructor.getStartLineNumber(false),
		column: newConstructor.getPos() - newConstructor.getStartLinePos(false),
		lines:
			newConstructor.getEndLineNumber() -
			newConstructor.getStartLineNumber(false),
	});

	return;
}
