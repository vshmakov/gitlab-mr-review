import {
	DiffLineType,
	ParsedDiff,
	ParsedDiffLine,
} from './parsed-diff';

export class UnifiedDiffParser {
	private static readonly HUNK_HEADER_PATTERN =
		/^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/;

	public parse(diff: string): ParsedDiff {
		const sourceLines = diff.split(/\r?\n/);
		const lines: ParsedDiffLine[] = [];

		let oldLine: number | undefined;
		let newLine: number | undefined;
		let insideHunk = false;

		for (
			let documentLine = 0;
			documentLine < sourceLines.length;
			documentLine++
		) {
			const content = sourceLines[documentLine];

			const hunkMatch = content.match(
				UnifiedDiffParser.HUNK_HEADER_PATTERN,
			);

			if (hunkMatch !== null) {
				oldLine = Number(hunkMatch[1]);
				newLine = Number(hunkMatch[2]);
				insideHunk = true;

				lines.push(
					this.createLine(
						documentLine,
						content,
						'hunk',
						false,
					),
				);

				continue;
			}

			if (!insideHunk) {
				lines.push(
					this.createLine(
						documentLine,
						content,
						'metadata',
						false,
					),
				);

				continue;
			}

			if (
				content ===
				'\\ No newline at end of file'
			) {
				lines.push(
					this.createLine(
						documentLine,
						content,
						'no-newline',
						false,
					),
				);

				continue;
			}

			if (
				oldLine === undefined ||
				newLine === undefined
			) {
				lines.push(
					this.createLine(
						documentLine,
						content,
						'metadata',
						false,
					),
				);

				continue;
			}

			if (content.startsWith('+')) {
				lines.push({
					documentLine,
					content,
					type: 'added',
					newLine,
					commentable: true,
				});

				newLine++;

				continue;
			}

			if (content.startsWith('-')) {
				lines.push({
					documentLine,
					content,
					type: 'deleted',
					oldLine,
					commentable: true,
				});

				oldLine++;

				continue;
			}

			if (content.startsWith(' ')) {
				lines.push({
					documentLine,
					content,
					type: 'context',
					oldLine,
					newLine,
					commentable: true,
				});

				oldLine++;
				newLine++;

				continue;
			}

			lines.push(
				this.createLine(
					documentLine,
					content,
					'metadata',
					false,
				),
			);
		}

		return {
			text: diff,
			lines,
		};
	}

	private createLine(
		documentLine: number,
		content: string,
		type: DiffLineType,
		commentable: boolean,
	): ParsedDiffLine {
		return {
			documentLine,
			content,
			type,
			commentable,
		};
	}
}