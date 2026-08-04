import { MergeRequestCategoryItem } from '../../../src/domain/tree/MergeRequestCategoryItem';
import { MergeRequestItem } from '../../../src/domain/tree/MergeRequestItem';
import { MergeRequestMessageItem } from '../../../src/domain/tree/MergeRequestMessageItem';

function createMockStore(): any {
	return {
		isCategoryLoading: jest.fn(() => false),
		isCategoryLoaded: jest.fn(() => true),
		getCategoryMRs: jest.fn(() => []),
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