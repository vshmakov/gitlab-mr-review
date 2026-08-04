import { createMergeRequestDiffsPath, mapMergeRequestFile } from '../../../../src/domain/diff/diff-utils';

describe('createMergeRequestDiffsPath', () => {
	it('produces correct path with project_id and iid', () => {
		const path = createMergeRequestDiffsPath({ project_id: 10, iid: 42 } as any);
		expect(path).toBe('/api/v4/projects/10/merge_requests/42/diffs?per_page=100');
	});
});

describe('mapMergeRequestFile', () => {
	it('maps normal file', () => {
		const diff = {
			old_path: 'src/app.ts',
			new_path: 'src/app.ts',
			diff: '+line',
			new_file: false,
			deleted_file: false,
			renamed_file: false,
		};
		const result = mapMergeRequestFile(diff);
		expect(result.path).toBe('src/app.ts');
		expect(result.oldPath).toBe('src/app.ts');
		expect(result.newPath).toBe('src/app.ts');
		expect(result.added).toBe(false);
		expect(result.deleted).toBe(false);
		expect(result.renamed).toBe(false);
	});

	it('maps added file', () => {
		const diff = {
			old_path: '',
			new_path: 'src/new.ts',
			diff: '+line',
			new_file: true,
			deleted_file: false,
			renamed_file: false,
		};
		const result = mapMergeRequestFile(diff);
		expect(result.path).toBe('src/new.ts');
		expect(result.added).toBe(true);
	});

	it('maps deleted file with old_path as path', () => {
		const diff = {
			old_path: 'src/old.ts',
			new_path: '',
			diff: '-line',
			new_file: false,
			deleted_file: true,
			renamed_file: false,
		};
		const result = mapMergeRequestFile(diff);
		expect(result.path).toBe('src/old.ts');
		expect(result.deleted).toBe(true);
	});

	it('maps renamed file', () => {
		const diff = {
			old_path: 'src/old.ts',
			new_path: 'src/new.ts',
			diff: '+line',
			new_file: false,
			deleted_file: false,
			renamed_file: true,
		};
		const result = mapMergeRequestFile(diff);
		expect(result.path).toBe('src/new.ts');
		expect(result.renamed).toBe(true);
	});
});