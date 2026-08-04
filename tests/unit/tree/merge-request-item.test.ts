import { MergeRequestItem } from '../../../src/domain/tree/MergeRequestItem';
import { MergeRequestApprovedItem, MergeRequestRequestedChangesItem } from '../../../src/domain/tree/ReviewerListTreeItem';
import { MergeRequestChangesItem } from '../../../src/domain/tree/MergeRequestChangesItem';
import { MergeRequestOverviewItem } from '../../../src/domain/tree/MergeRequestOverviewItem';

function createMockStore(): any {
	return {
		isApprovalLoading: jest.fn(() => false),
		getApprovalData: jest.fn(() => ({
			approvedBy: [{ name: 'Reviewer', username: 'reviewer' }],
			requestedChanges: [],
		})),
		files: { getFiles: jest.fn(() => []) },
		loadApprovalData: jest.fn(),
		loadFiles: jest.fn(),
	};
}

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

	it('returns empty children when approval data is loading', () => {
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

		expect(children).toHaveLength(0);
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

		expect(children).toHaveLength(4);
		expect(children[0]).toBeInstanceOf(MergeRequestOverviewItem);
		expect(children[1]).toBeInstanceOf(MergeRequestApprovedItem);
		expect(children[2]).toBeInstanceOf(MergeRequestRequestedChangesItem);
		expect(children[3]).toBeInstanceOf(MergeRequestChangesItem);
	});
});