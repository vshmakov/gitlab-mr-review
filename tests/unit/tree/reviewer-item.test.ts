import { MergeRequestApprovedItem, MergeRequestRequestedChangesItem } from '../../../src/domain/tree/ReviewerListTreeItem';
import { MergeRequestReviewerItem } from '../../../src/domain/tree/MergeRequestReviewerItem';

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

describe('Tree: MergeRequestRequestedChangesItem', () => {
	it('shows reviewer count in label', () => {
		const item = new MergeRequestRequestedChangesItem({
			approvedBy: [],
			requestedChanges: [
				{ name: 'Alice', username: 'alice' },
				{ name: 'Bob', username: 'bob' },
			],
		});

		expect(item.label).toBe('Requested Changes (2)');
	});

	it('returns reviewer children', () => {
		const item = new MergeRequestRequestedChangesItem({
			approvedBy: [],
			requestedChanges: [{ name: 'Alice', username: 'alice' }],
		});

		const children = item.getChildren();
		expect(children).toHaveLength(1);
		expect(children[0]).toBeInstanceOf(MergeRequestReviewerItem);
	});
});

describe('Tree: MergeRequestReviewerItem', () => {
	it('displays reviewer name and username', () => {
		const item = new MergeRequestReviewerItem({ name: 'Alice', username: 'alice' });
		expect(item.label).toBe('Alice');
		expect(item.description).toBe('alice');
	});
});