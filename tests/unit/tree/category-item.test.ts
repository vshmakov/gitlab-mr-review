import { MergeRequestCategoryItem } from '../../../src/domain/tree/MergeRequestCategoryItem';
import { MergeRequestItem } from '../../../src/domain/tree/MergeRequestItem';
import { MergeRequestMessageItem } from '../../../src/domain/tree/MergeRequestMessageItem';

function createMockStore(): any {
	return {
		isCategoryLoading: jest.fn(() => false),
		isCategoryLoaded: jest.fn(() => true),
		getCategoryMRs: jest.fn(() => []),
		loadPending: jest.fn(),
		loadApproved: jest.fn(),
		loadRequestedChanges: jest.fn(),
		loadMissedReview: jest.fn(),
		loadMyMergeRequests: jest.fn(),
	};
}

describe('Tree: MergeRequestCategoryItem', () => {
	it('returns empty children when category is loading', () => {
		const store = createMockStore();
		store.isCategoryLoading.mockReturnValue(true);
		store.isCategoryLoaded.mockReturnValue(false);

		const item = new MergeRequestCategoryItem('needsReview', store);
		const children = item.getChildren();

		expect(children).toHaveLength(0);
	});

	it('returns empty children and triggers load when not loaded', () => {
		const store = createMockStore();
		store.isCategoryLoaded.mockReturnValue(false);
		store.isCategoryLoading.mockReturnValue(false);

		const item = new MergeRequestCategoryItem('needsReview', store);
		const children = item.getChildren();

		expect(children).toHaveLength(0);
		expect(store.loadPending).toHaveBeenCalled();
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

	it.each([
		{ category: 'needsReview' as const, label: 'Needs My Review', contextValue: 'categoryNeedsReview', icon: 'git-pull-request' },
		{ category: 'approved' as const, label: 'I Approved', contextValue: 'categoryApproved', icon: 'check' },
		{ category: 'requestedChanges' as const, label: 'I Requested Changes', contextValue: 'categoryRequestedChanges', icon: 'warning' },
		{ category: 'missed' as const, label: 'Missed Review', contextValue: 'categoryMissed', icon: 'warning' },
		{ category: 'my' as const, label: 'My', contextValue: 'categoryMy', icon: 'person' },
	])('sets correct properties for $label', ({ category, label, contextValue, icon }) => {
		const store = createMockStore();
		const item = new MergeRequestCategoryItem(category, store);

		expect(item.label).toBe(label);
		expect(item.contextValue).toBe(contextValue);
		expect(item.collapsibleState).toBe('collapsed');
		expect(item.icon).toEqual({ name: icon });
	});
});