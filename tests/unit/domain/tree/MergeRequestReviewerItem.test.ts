import { MergeRequestApprovedItem, MergeRequestRequestedChangesItem } from '../../../../src/domain/tree/ReviewerListTreeItem';
import { MergeRequestReviewerItem } from '../../../../src/domain/tree/MergeRequestReviewerItem';

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

	it('has correct static properties', () => {
		const item = new MergeRequestApprovedItem({
			approvedBy: [{ name: 'Alice', username: 'alice' }],
			requestedChanges: [],
		});
		expect(item.contextValue).toBe('approved');
		expect(item.collapsibleState).toBe('collapsed');
		expect(item.icon).toEqual({ name: 'check', color: 'charts.green' });
	});

	it('collapsibleState is none when no reviewers', () => {
		const item = new MergeRequestApprovedItem({
			approvedBy: [],
			requestedChanges: [],
		});
		expect(item.collapsibleState).toBe('none');
	});

	it('returns empty children when no reviewers', () => {
		const item = new MergeRequestApprovedItem({
			approvedBy: [],
			requestedChanges: [],
		});
		expect(item.getChildren()).toHaveLength(0);
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

	it('has correct static properties', () => {
		const item = new MergeRequestRequestedChangesItem({
			approvedBy: [],
			requestedChanges: [{ name: 'Alice', username: 'alice' }],
		});
		expect(item.contextValue).toBe('requestedChanges');
		expect(item.collapsibleState).toBe('collapsed');
		expect(item.icon).toEqual({ name: 'warning', color: 'charts.yellow' });
	});

	it('collapsibleState is none when no reviewers', () => {
		const item = new MergeRequestRequestedChangesItem({
			approvedBy: [],
			requestedChanges: [],
		});
		expect(item.collapsibleState).toBe('none');
	});
});

describe('Tree: MergeRequestReviewerItem', () => {
	it('displays reviewer name and username', () => {
		const item = new MergeRequestReviewerItem({ name: 'Alice', username: 'alice' });
		expect(item.label).toBe('Alice');
		expect(item.description).toBe('alice');
	});

	it('tooltip contains username', () => {
		const item = new MergeRequestReviewerItem({ name: 'Alice', username: 'alice' });
		expect(item.tooltip).toBe('@alice');
	});

	it('accessibilityLabel contains name and username', () => {
		const item = new MergeRequestReviewerItem({ name: 'Alice', username: 'alice' });
		expect(item.accessibilityLabel).toBe('Alice (@alice)');
	});

	it('has correct static properties', () => {
		const item = new MergeRequestReviewerItem({ name: 'Alice', username: 'alice' });
		expect(item.contextValue).toBe('reviewer');
		expect(item.collapsibleState).toBe('none');
		expect(item.icon).toEqual({ name: 'person' });
	});

	it('has no children', () => {
		const item = new MergeRequestReviewerItem({ name: 'Alice', username: 'alice' });
		expect(item.getChildren()).toHaveLength(0);
	});
});