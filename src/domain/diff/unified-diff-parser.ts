import {
	DiffLineType,
	ParsedDiff,
	ParsedDiffLine,
} from './parsed-diff';

interface HunkState {
	oldLine: number | undefined;
	newLine: number | undefined;
	insideHunk: boolean;
}

export class UnifiedDiffParser {
	private static readonly HUNK_HEADER_PATTERN =
		/^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/;

	public parse(diff: string): ParsedDiff {
		const sourceLines = diff.split(/\r?\n/);
		const lines: ParsedDiffLine[] = [];

		let state: HunkState = {
			oldLine: undefined,
			newLine: undefined,
			insideHunk: false,
		};

		for (
			let documentLine = 0;
			documentLine < sourceLines.length;
			documentLine++
		) {
			const content = sourceLines[documentLine];

			const result = this.processLine(
				documentLine,
				content,
				state,
			);

			lines.push(result.line);
			state = result.state;
		}

		return { text: diff, lines };
	}

	private processLine(
		documentLine: number,
		content: string,
		state: HunkState,
	): { line: ParsedDiffLine; state: HunkState } {
		// 1. Hunk header
		const hunkResult = this.tryParseHunkHeader(
			documentLine,
			content,
			state,
		);
		if (hunkResult !== null) {return hunkResult;}

		// 2. Before any hunk — treat as metadata
		if (!state.insideHunk) {
			return {
				line: this.createLine(
					documentLine,
					content,
					'metadata',
					false,
				),
				state,
			};
		}

		// 3. No-newline marker
		if (content === '\\ No newline at end of file') {
			return {
				line: this.createLine(
					documentLine,
					content,
					'no-newline',
					false,
				),
				state,
			};
		}

		// 4. Line counters not set — fallback to metadata
		if (state.oldLine === undefined || state.newLine === undefined) {
			return {
				line: this.createLine(
					documentLine,
					content,
					'metadata',
					false,
				),
				state,
			};
		}

		// 5. Added line
		if (content.startsWith('+')) {
			return {
				line: {
					documentLine,
					content,
					type: 'added',
					newLine: state.newLine,
					commentable: true,
				},
				state: { ...state, newLine: state.newLine + 1 },
			};
		}

		// 6. Deleted line
		if (content.startsWith('-')) {
			return {
				line: {
					documentLine,
					content,
					type: 'deleted',
					oldLine: state.oldLine,
					commentable: true,
				},
				state: { ...state, oldLine: state.oldLine + 1 },
			};
		}

		// 7. Context line
		if (content.startsWith(' ')) {
			return {
				line: {
					documentLine,
					content,
					type: 'context',
					oldLine: state.oldLine,
					newLine: state.newLine,
					commentable: true,
				},
				state: {
					...state,
					oldLine: state.oldLine + 1,
					newLine: state.newLine + 1,
				},
			};
		}

		// 8. Default — metadata inside hunk
		return {
			line: this.createLine(
				documentLine,
				content,
				'metadata',
				false,
			),
			state,
		};
	}

	private tryParseHunkHeader(
		documentLine: number,
		content: string,
		state: HunkState,
	): { line: ParsedDiffLine; state: HunkState } | null {
		const match = content.match(
			UnifiedDiffParser.HUNK_HEADER_PATTERN,
		);

		if (match === null) {
			return null;
		}

		return {
			line: this.createLine(
				documentLine,
				content,
				'hunk',
				false,
			),
			state: {
				...state,
				oldLine: Number(match[1]),
				newLine: Number(match[2]),
				insideHunk: true,
			},
		};
	}

	private createLine(
		documentLine: number,
		content: string,
		type: DiffLineType,
		commentable: boolean,
	): ParsedDiffLine {
		return { documentLine, content, type, commentable };
	}
}