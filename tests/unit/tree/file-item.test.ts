import { MergeRequestFileItem } from '../../../src/domain/tree/MergeRequestFileItem';

function createMockStore(): any {
	return {
		reviewed: {
			isReviewed: jest.fn(() => false),
		},
	};
}

describe('Tree: MergeRequestFileItem', () => {
	it('shows file name with prefix', () => {
		const mr = { id: 100, iid: 42, project_id: 10 };
		const file = {
			path: 'src/app.ts', oldPath: 'src/app.ts', newPath: 'src/app.ts',
			diff: '+line', added: false, deleted: false, renamed: false,
		};

		const item = new MergeRequestFileItem(mr as any, file);
		expect(item.label).toContain('app.ts');
		expect(item.label).toMatch(/^[AMD]/);
	});

	it('shows added prefix for new files', () => {
		const file = {
			path: 'src/new.ts', oldPath: '', newPath: 'src/new.ts',
			diff: '+line', added: true, deleted: false, renamed: false,
		};
		const item = new MergeRequestFileItem({} as any, file);
		expect(item.label).toMatch(/^A/);
	});

	it('shows deleted prefix for deleted files', () => {
		const file = {
			path: 'src/old.ts', oldPath: 'src/old.ts', newPath: '',
			diff: '-line', added: false, deleted: true, renamed: false,
		};
		const item = new MergeRequestFileItem({} as any, file);
		expect(item.label).toMatch(/^D/);
	});

	it('returns true from getReviewed when flagged', () => {
		const file = {
			path: 'src/app.ts', oldPath: 'src/app.ts', newPath: 'src/app.ts',
			diff: '+line', added: false, deleted: false, renamed: false,
		};
		const item = new MergeRequestFileItem(null as any, file, () => true);
		expect(item.getReviewed()).toBe(true);
	});

	it('returns false from getReviewed when not flagged', () => {
		const file = {
			path: 'src/app.ts', oldPath: 'src/app.ts', newPath: 'src/app.ts',
			diff: '+line', added: false, deleted: false, renamed: false,
		};
		const item = new MergeRequestFileItem(null as any, file, () => false);
		expect(item.getReviewed()).toBe(false);
	});

	it('reflects reviewed state from store dynamically', () => {
		const store = createMockStore();
		store.reviewed.isReviewed.mockReturnValue(false);
		const file = {
			path: 'src/app.ts', oldPath: 'src/app.ts', newPath: 'src/app.ts',
			diff: '+line', added: false, deleted: false, renamed: false,
		};
		const mr = { id: 100, iid: 42 };
		const item = new MergeRequestFileItem(
			mr as any,
			file,
			MergeRequestFileItem.isReviewed(store, mr as any, file),
		);

		expect(item.contextValue).toBe('mergeRequestFile');
		expect(item.label).not.toMatch(/^\*/);

		// Simulate marking as reviewed
		store.reviewed.isReviewed.mockReturnValue(true);

		expect(item.contextValue).toBe('mergeRequestFile.reviewed');
		expect(item.label).toMatch(/^\*/);
	});
});