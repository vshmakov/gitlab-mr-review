import { MergeRequestOverviewItem } from '../../../src/domain/tree/MergeRequestOverviewItem';

describe('Tree: MergeRequestOverviewItem', () => {
	it('label without notesCount', () => {
		const item = new MergeRequestOverviewItem();
		expect(item.label).toBe('Overview');
	});

	it('label with notesCount', () => {
		const item = new MergeRequestOverviewItem(5);
		expect(item.label).toBe('Overview (5)');
	});

	it('label with notesCount 0', () => {
		const item = new MergeRequestOverviewItem(0);
		expect(item.label).toBe('Overview (0)');
	});

	it('has correct static properties', () => {
		const item = new MergeRequestOverviewItem();
		expect(item.contextValue).toBe('overview');
		expect(item.collapsibleState).toBe('none');
		expect(item.icon).toEqual({ name: 'info' });
	});

	it('has no children', () => {
		const item = new MergeRequestOverviewItem();
		expect(item.getChildren()).toHaveLength(0);
	});
});