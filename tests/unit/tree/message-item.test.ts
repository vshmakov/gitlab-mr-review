import { MergeRequestMessageItem } from '../../../src/domain/tree/MergeRequestMessageItem';

describe('Tree: MergeRequestMessageItem', () => {
	it('displays message as label', () => {
		const item = new MergeRequestMessageItem('Loading...');
		expect(item.label).toBe('Loading...');
	});

	it('has no children', () => {
		const item = new MergeRequestMessageItem('test');
		expect(item.getChildren()).toHaveLength(0);
	});

	it('has correct static properties', () => {
		const item = new MergeRequestMessageItem('test');
		expect(item.contextValue).toBe('message');
		expect(item.collapsibleState).toBe('none');
	});
});