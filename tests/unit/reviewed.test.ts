import { ReviewedFilesStore } from '../../src/domain/store/ReviewedFilesStore';
import { GitLabMergeRequest } from '../../src/domain/model/GitLabMergeRequest';
import { GitLabMergeRequestFile } from '../../src/domain/model/GitLabMergeRequestFile';

function createMR(): GitLabMergeRequest {
	return {
		id: 100, iid: 42, title: 'Fix bug', web_url: 'http://test',
		project_id: 10, updated_at: '2024-01-01',
		draft: false, work_in_progress: false,
		author: { name: 'Author', username: 'author' },
	};
}

function createFile(path: string, diff: string): GitLabMergeRequestFile {
	return {
		path, oldPath: path, newPath: path, diff,
		added: false, deleted: false, renamed: false,
	};
}

describe('ReviewedFilesStore', () => {
	it('returns false for unknown file', () => {
		const store = new ReviewedFilesStore();
		const mr = createMR();
		const file = createFile('src/app.ts', '+line');

		expect(store.isReviewed(mr, file)).toBe(false);
	});

	it('marks file as reviewed', () => {
		const store = new ReviewedFilesStore();
		const mr = createMR();
		const file = createFile('src/app.ts', '+line');

		store.markAsReviewed(mr, file);

		expect(store.isReviewed(mr, file)).toBe(true);
	});

	it('unmarks file as reviewed', () => {
		const store = new ReviewedFilesStore();
		const mr = createMR();
		const file = createFile('src/app.ts', '+line');

		store.markAsReviewed(mr, file);
		store.unmarkAsReviewed(mr, file);

		expect(store.isReviewed(mr, file)).toBe(false);
	});

	it('detects file change via diff hash', () => {
		const store = new ReviewedFilesStore();
		const mr = createMR();
		const file = createFile('src/app.ts', '+line');

		store.markAsReviewed(mr, file);
		expect(store.isReviewed(mr, file)).toBe(true);

		// File content changed
		const changedFile = createFile('src/app.ts', '+new line');
		expect(store.isReviewed(mr, changedFile)).toBe(false);
	});

	it('filters reviewed and unreviewed files', () => {
		const store = new ReviewedFilesStore();
		const mr = createMR();
		const file1 = createFile('src/a.ts', '+a');
		const file2 = createFile('src/b.ts', '+b');
		const file3 = createFile('src/c.ts', '+c');

		store.markAsReviewed(mr, file1);
		store.markAsReviewed(mr, file2);

		const allFiles = [file1, file2, file3];
		expect(store.getReviewedFiles(mr, allFiles)).toHaveLength(2);
		expect(store.getUnreviewedFiles(mr, allFiles)).toHaveLength(1);
	});

	it('serializes and restores snapshot', () => {
		const store = new ReviewedFilesStore();
		const mr = createMR();
		const file = createFile('src/app.ts', '+line');

		store.markAsReviewed(mr, file);

		const snapshot = store.getSnapshot();
		expect(Object.keys(snapshot)).toHaveLength(1);

		const newStore = new ReviewedFilesStore();
		newStore.restoreSnapshot(snapshot);

		expect(newStore.isReviewed(mr, file)).toBe(true);
	});
});