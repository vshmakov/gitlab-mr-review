import { MergeRequestChangesItem } from '../../../src/domain/tree/MergeRequestChangesItem';
import { MergeRequestFileItem } from '../../../src/domain/tree/MergeRequestFileItem';
import { MergeRequestReviewedItem } from '../../../src/domain/tree/MergeRequestReviewedItem';

function createMockStore(): any {
	return {
		isFilesLoading: jest.fn(() => false),
		files: { getFiles: jest.fn(() => []) },
		reviewed: {
			getReviewedFiles: jest.fn(() => []),
			isReviewed: jest.fn(() => false),
		},
		loadFiles: jest.fn(),
	};
}

describe('Tree: MergeRequestChangesItem', () => {
	it('returns empty children when files are loading', () => {
		const store = createMockStore();
		store.isFilesLoading.mockReturnValue(true);

		const mr = { id: 100, iid: 42 };
		const item = new MergeRequestChangesItem(mr as any, store);
		const children = item.getChildren();

		expect(children).toHaveLength(0);
	});

	it('returns file items when loaded', () => {
		const store = createMockStore();
		store.isFilesLoading.mockReturnValue(false);
		store.files.getFiles.mockReturnValue([
			{ path: 'src/app.ts', oldPath: 'src/app.ts', newPath: 'src/app.ts', diff: '+line', added: false, deleted: false, renamed: false },
		]);

		const mr = { id: 100, iid: 42, project_id: 10 };
		const item = new MergeRequestChangesItem(mr as any, store);
		const children = item.getChildren();

		expect(children).toHaveLength(1);
		expect(children[0]).toBeInstanceOf(MergeRequestFileItem);
	});

	it('shows Reviewed sub-item when files are reviewed', () => {
		const store = createMockStore();
		store.isFilesLoading.mockReturnValue(false);
		const files = [
			{ path: 'src/a.ts', oldPath: 'src/a.ts', newPath: 'src/a.ts', diff: '+a', added: false, deleted: false, renamed: false },
			{ path: 'src/b.ts', oldPath: 'src/b.ts', newPath: 'src/b.ts', diff: '+b', added: false, deleted: false, renamed: false },
		];
		store.files.getFiles.mockReturnValue(files);
		store.reviewed.getReviewedFiles.mockReturnValue([files[0]]);
		store.reviewed.isReviewed.mockImplementation((mr: any, f: any) => f.path === 'src/a.ts');

		const mr = { id: 100, iid: 42, project_id: 10 };
		const item = new MergeRequestChangesItem(mr as any, store);
		const children = item.getChildren();

		expect(children).toHaveLength(2);
		expect(children[0]).toBeInstanceOf(MergeRequestReviewedItem);
		expect(children[1]).toBeInstanceOf(MergeRequestFileItem);
	});

	it('does not show Reviewed when no files are reviewed', () => {
		const store = createMockStore();
		store.isFilesLoading.mockReturnValue(false);
		const files = [
			{ path: 'src/a.ts', oldPath: 'src/a.ts', newPath: 'src/a.ts', diff: '+a', added: false, deleted: false, renamed: false },
		];
		store.files.getFiles.mockReturnValue(files);
		store.reviewed.getReviewedFiles.mockReturnValue([]);
		store.reviewed.isReviewed.mockReturnValue(false);

		const mr = { id: 100, iid: 42, project_id: 10 };
		const item = new MergeRequestChangesItem(mr as any, store);
		const children = item.getChildren();

		expect(children).toHaveLength(1);
		expect(children[0]).toBeInstanceOf(MergeRequestFileItem);
	});
});

describe('Tree: MergeRequestReviewedItem', () => {
	it('shows count in label', () => {
		const store = createMockStore();
		const files = [
			{ path: 'src/a.ts', oldPath: 'src/a.ts', newPath: 'src/a.ts', diff: '+a', added: false, deleted: false, renamed: false },
		];
		const item = new MergeRequestReviewedItem({} as any, files, 1, store);
		expect(item.label).toBe('Reviewed (1)');
	});

	it('returns file items as children', () => {
		const store = createMockStore();
		const files = [
			{ path: 'src/a.ts', oldPath: 'src/a.ts', newPath: 'src/a.ts', diff: '+a', added: false, deleted: false, renamed: false },
		];
		const item = new MergeRequestReviewedItem({} as any, files, 1, store);
		const children = item.getChildren();

		expect(children).toHaveLength(1);
		expect(children[0]).toBeInstanceOf(MergeRequestFileItem);
	});

	it('reflects reviewed state from store dynamically', () => {
		const store = createMockStore();
		store.reviewed.isReviewed.mockReturnValue(true);
		const files = [
			{ path: 'src/a.ts', oldPath: 'src/a.ts', newPath: 'src/a.ts', diff: '+a', added: false, deleted: false, renamed: false },
		];
		const item = new MergeRequestReviewedItem({} as any, files, 1, store);
		const child = item.getChildren()[0];

		expect(child.contextValue).toBe('mergeRequestFile.reviewed');
		expect(child.label).toMatch(/^\*/);

		// Simulate unmarking: store now returns false
		store.reviewed.isReviewed.mockReturnValue(false);

		expect(child.contextValue).toBe('mergeRequestFile');
		expect(child.label).not.toMatch(/^\*/);
	});
});