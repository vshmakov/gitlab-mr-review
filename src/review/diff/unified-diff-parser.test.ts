import { UnifiedDiffParser } from './unified-diff-parser';
import { ParsedDiff } from './parsed-diff';

describe('UnifiedDiffParser', () => {
	let parser: UnifiedDiffParser;
	let result: ParsedDiff;

	beforeEach(() => {
		parser = new UnifiedDiffParser();
	});

	describe('hunk headers', () => {
		it('parses a single hunk header', () => {
			result = parser.parse('@@ -10,2 +10,3 @@ README.md');
			expect(result.lines).toHaveLength(1);
			expect(result.lines[0].type).toBe('hunk');
			expect(result.lines[0].commentable).toBe(false);
		});

		it('parses hunk without range counts', () => {
			result = parser.parse('@@ -10 +10 @@ README.md');
			expect(result.lines[0].type).toBe('hunk');
		});
	});

	describe('added lines', () => {
		it('identifies added lines with +', () => {
			result = parser.parse([
				'@@ -1,0 +1,1 @@',
				'+new line',
			].join('\n'));

			const added = result.lines.find(l => l.type === 'added');
			expect(added).toBeDefined();
			expect(added!.content).toBe('+new line');
			expect(added!.newLine).toBe(1);
			expect(added!.commentable).toBe(true);
		});

		it('increments newLine counter for each added line', () => {
			result = parser.parse([
				'@@ -1,0 +1,2 @@',
				'+line one',
				'+line two',
			].join('\n'));

			const added = result.lines.filter(l => l.type === 'added');
			expect(added[0].newLine).toBe(1);
			expect(added[1].newLine).toBe(2);
		});
	});

	describe('deleted lines', () => {
		it('identifies deleted lines with -', () => {
			result = parser.parse([
				'@@ -1,1 +1,0 @@',
				'-old line',
			].join('\n'));

			const deleted = result.lines.find(l => l.type === 'deleted');
			expect(deleted).toBeDefined();
			expect(deleted!.content).toBe('-old line');
			expect(deleted!.oldLine).toBe(1);
			expect(deleted!.commentable).toBe(true);
		});

		it('increments oldLine counter for each deleted line', () => {
			result = parser.parse([
				'@@ -1,2 +1,0 @@',
				'-old one',
				'-old two',
			].join('\n'));

			const deleted = result.lines.filter(l => l.type === 'deleted');
			expect(deleted[0].oldLine).toBe(1);
			expect(deleted[1].oldLine).toBe(2);
		});
	});

	describe('context lines', () => {
		it('identifies context lines with leading space', () => {
			result = parser.parse([
				'@@ -1,1 +1,1 @@',
				' unchanged',
			].join('\n'));

			const ctx = result.lines.find(l => l.type === 'context');
			expect(ctx).toBeDefined();
			expect(ctx!.content).toBe(' unchanged');
			expect(ctx!.oldLine).toBe(1);
			expect(ctx!.newLine).toBe(1);
			expect(ctx!.commentable).toBe(true);
		});

		it('increments both oldLine and newLine for context', () => {
			result = parser.parse([
				'@@ -1,2 +1,2 @@',
				' ctx one',
				' ctx two',
			].join('\n'));

			const ctx = result.lines.filter(l => l.type === 'context');
			expect(ctx[0].oldLine).toBe(1);
			expect(ctx[0].newLine).toBe(1);
			expect(ctx[1].oldLine).toBe(2);
			expect(ctx[1].newLine).toBe(2);
		});
	});

	describe('metadata lines', () => {
		it('treats lines before hunk as metadata', () => {
			result = parser.parse([
				'diff --git a/file.txt b/file.txt',
				'index abc123..def456 100644',
				'@@ -1,0 +1,1 @@',
			].join('\n'));

			const metadata = result.lines.filter(l => l.type === 'metadata');
			expect(metadata).toHaveLength(2);
			expect(metadata[0].content).toBe('diff --git a/file.txt b/file.txt');
			expect(metadata[1].content).toBe('index abc123..def456 100644');
		});

		it('metadata lines are not commentable', () => {
			result = parser.parse('diff --git a/x b/x');
			expect(result.lines[0].commentable).toBe(false);
		});
	});

	describe('no-newline marker', () => {
		it('identifies no-newline marker', () => {
			result = parser.parse([
				'@@ -1,0 +1,1 @@',
				'+no newline',
				'\\ No newline at end of file',
			].join('\n'));

			const marker = result.lines.find(l => l.type === 'no-newline');
			expect(marker).toBeDefined();
			expect(marker!.commentable).toBe(false);
		});
	});

	describe('multiple hunks', () => {
		it('resets line counters for each new hunk', () => {
			result = parser.parse([
				'@@ -1,1 +1,1 @@',
				' first hunk',
				'@@ -10,1 +10,1 @@',
				' second hunk',
			].join('\n'));

			const contexts = result.lines.filter(l => l.type === 'context');
			expect(contexts[0].oldLine).toBe(1);
			expect(contexts[0].newLine).toBe(1);
			expect(contexts[1].oldLine).toBe(10);
			expect(contexts[1].newLine).toBe(10);
		});
	});

	describe('mixed content', () => {
		it('parses a realistic diff', () => {
			const diff = [
				'diff --git a/README.md b/README.md',
				'index 123..456 100644',
				'--- a/README.md',
				'+++ b/README.md',
				'@@ -1,3 +1,4 @@',
				' context line',
				'-removed line',
				'+added line',
				'+another added',
				' more context',
			].join('\n');

			result = parser.parse(diff);

			expect(result.lines.filter(l => l.type === 'metadata')).toHaveLength(4);
			expect(result.lines.filter(l => l.type === 'hunk')).toHaveLength(1);
			expect(result.lines.filter(l => l.type === 'context')).toHaveLength(2);
			expect(result.lines.filter(l => l.type === 'deleted')).toHaveLength(1);
			expect(result.lines.filter(l => l.type === 'added')).toHaveLength(2);

			// Verify line counters
			const deleted = result.lines.find(l => l.type === 'deleted')!;
			expect(deleted.oldLine).toBe(2);

			const added1 = result.lines.filter(l => l.type === 'added')[0];
			expect(added1.newLine).toBe(2);

			const added2 = result.lines.filter(l => l.type === 'added')[1];
			expect(added2.newLine).toBe(3);
		});
	});

	describe('edge cases', () => {
		it('handles empty diff', () => {
			result = parser.parse('');
			expect(result.lines).toHaveLength(1);
			expect(result.lines[0].content).toBe('');
		});

		it('preserves original text in result', () => {
			const diff = '@@ -1,1 +1,1 @@\nline';
			result = parser.parse(diff);
			expect(result.text).toBe(diff);
		});

		it('documentLine matches array index', () => {
			result = parser.parse([
				'@@ -1,3 +1,3 @@',
				' a',
				' b',
				' c',
			].join('\n'));

			result.lines.forEach((line, idx) => {
				expect(line.documentLine).toBe(idx);
			});
		});
	});
});