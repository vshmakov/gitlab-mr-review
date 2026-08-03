import { MergeRequestCategoryItem } from '../../src/domain/tree/MergeRequestCategoryItem';
import { MergeRequestItem } from '../../src/domain/tree/MergeRequestItem';
import { MergeRequestChangesItem } from '../../src/domain/tree/MergeRequestChangesItem';
import { MergeRequestFileItem } from '../../src/domain/tree/MergeRequestFileItem';
import { MergeRequestMessageItem } from '../../src/domain/tree/MergeRequestMessageItem';
import { MergeRequestApprovedItem, MergeRequestRequestedChangesItem } from '../../src/domain/tree/ReviewerListTreeItem';
import { MergeRequestReviewerItem } from '../../src/domain/tree/MergeRequestReviewerItem';

// Mock store
function createMockStore(): any {
	return {
		isCategoryLoading: jest.fn(() => false),
		isCategoryLoaded: jest.fn(() => true),
		getCategoryMRs: jest.fn(() => []),
		isFilesLoading: jest.fn(() => false),
		files: { getFiles: jest.fn(() => []) },
		isApprovalLoading: jest.fn(() => false),
		getApprovalData: jest.fn(() => ({
			approvedBy: [{ name: 'Reviewer', username: 'reviewer' }],
			requestedChanges: [],
		})),
		loadPending: jest.fn(),
		loadApproved: jest.fn(),
		loadRequestedChanges: jest.fn(),
		loadMissedReview: jest.fn(),
		loadMyMergeRequests: jest.fn(),
		loadFiles: jest.fn(),
	};
}

describe('Tree: MergeRequestCategoryItem', () => {
	it('returns loading message when category is loading', () => {
		const store = createMockStore();
		store.isCategoryLoading.mockReturnValue(true);

		const item = new MergeRequestCategoryItem('needsReview', store);
		const children = item.getChildren();

		expect(children).toHaveLength(1);
		expect(children[0]).toBeInstanceOf(MergeRequestMessageItem);
	});

	it('returns empty message when no MRs', () => {
		const store = createMockStore();
		store.isCategoryLoaded.mockReturnValue(true);
		store.getCategoryMRs.mockReturnValue([]);

		const item = new MergeRequestCategoryItem('needsReview', store);
		const children = item.getChildren();

		expect(children).toHaveLength(1);
		expect(children[0]).toBeInstanceOf(MergeRequestMessageItem);
	});

	it('returns MR items when loaded', () => {
		const store = createMockStore();
		const mr = {
			id: 100, iid: 42, title: 'Fix bug', web_url: 'http://test',
			project_id: 10, project_path: 'g/p', updated_at: '2024-01-01',
			draft: false, work_in_progress: false,
			author: { name: 'Author', username: 'author' },
		};
		store.getCategoryMRs.mockReturnValue([mr]);

		const item = new MergeRequestCategoryItem('needsReview', store);
		const children = item.getChildren();

		expect(children).toHaveLength(1);
		expect(children[0]).toBeInstanceOf(MergeRequestItem);
	});
});

describe('Tree: MergeRequestItem', () => {
	it('label contains iid and title without markdown', () => {
		const store = createMockStore();

		const mr = {
			id: 100, iid: 42, title: 'Fix bug', web_url: 'http://test',
			project_id: 10, project_path: 'g/p', updated_at: '2024-01-01',
			draft: false, work_in_progress: false,
			author: { name: 'Author', username: 'author' },
		};
		const item = new MergeRequestItem(mr, store);

		expect(item.label).toBe('Fix bug !42');
		expect(item.label).not.toContain('**');
	});

	it('returns loading message when approval data is loading', () => {
		const store = createMockStore();
		store.isApprovalLoading.mockReturnValue(true);

		const mr = {
			id: 100, iid: 42, title: 'Fix bug', web_url: 'http://test',
			project_id: 10, project_path: 'g/p', updated_at: '2024-01-01',
			draft: false, work_in_progress: false,
			author: { name: 'Author', username: 'author' },
		};
		const item = new MergeRequestItem(mr, store);
		const children = item.getChildren();

		expect(children).toHaveLength(1);
		expect(children[0]).toBeInstanceOf(MergeRequestMessageItem);
	});

	it('returns approved, requestedChanges, changes when loaded', () => {
		const store = createMockStore();
		store.isApprovalLoading.mockReturnValue(false);
		store.getApprovalData.mockReturnValue({
			approvedBy: [{ name: 'Reviewer', username: 'reviewer' }],
			requestedChanges: [],
		});

		const mr = {
			id: 100, iid: 42, title: 'Fix bug', web_url: 'http://test',
			project_id: 10, project_path: 'g/p', updated_at: '2024-01-01',
			draft: false, work_in_progress: false,
			author: { name: 'Author', username: 'author' },
		};
		const item = new MergeRequestItem(mr, store);
		const children = item.getChildren();

		expect(children).toHaveLength(3);
		expect(children[0]).toBeInstanceOf(MergeRequestApprovedItem);
		expect(children[1]).toBeInstanceOf(MergeRequestRequestedChangesItem);
		expect(children[2]).toBeInstanceOf(MergeRequestChangesItem);
	});
});

describe('Tree: MergeRequestChangesItem', () => {
	it('returns loading message when files are loading', () => {
		const store = createMockStore();
		store.isFilesLoading.mockReturnValue(true);

		const mr = { id: 100, iid: 42 };
		const item = new MergeRequestChangesItem(mr as any, store);
		const children = item.getChildren();

		expect(children).toHaveLength(1);
		expect(children[0]).toBeInstanceOf(MergeRequestMessageItem);
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
});

describe('Tree: MergeRequestApprovedItem', () => {
	it('shows reviewer count in label', () => {
		const item = new MergeRequestApprovedItem({
			approvedBy: [
				{ name: 'Alice', username: 'alice' },
				{ name: 'Bob', username: 'bob' },
			],
			requestedChanges: [],
		});

		expect(item.label).toBe('Approved (2)');
	});

	it('returns reviewer children', () => {
		const item = new MergeRequestApprovedItem({
			approvedBy: [{ name: 'Alice', username: 'alice' }],
			requestedChanges: [],
		});

		const children = item.getChildren();
		expect(children).toHaveLength(1);
		expect(children[0]).toBeInstanceOf(MergeRequestReviewerItem);
	});
});

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
});

describe('Tree: MergeRequestMessageItem', () => {
	it('displays message as label', () => {
		const item = new MergeRequestMessageItem('Loading...');
		expect(item.label).toBe('Loading...');
	});

	it('has no children', () => {
		const item = new MergeRequestMessageItem('test');
		expect(item.getChildren()).toHaveLength(0);
	});
});

describe('Tree: MergeRequestReviewerItem', () => {
	it('displays reviewer name and username', () => {
		const item = new MergeRequestReviewerItem({ name: 'Alice', username: 'alice' });
		expect(item.label).toBe('Alice');
		expect(item.description).toBe('alice');
	});
});