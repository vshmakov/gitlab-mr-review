import { CATEGORIES } from '../../../src/domain/tree/tree-item';

describe('CATEGORIES', () => {
	it('has 5 categories', () => {
		expect(CATEGORIES).toHaveLength(5);
	});

	it('contains all expected categories', () => {
		expect(CATEGORIES).toContain('my');
		expect(CATEGORIES).toContain('needsReview');
		expect(CATEGORIES).toContain('requestedChanges');
		expect(CATEGORIES).toContain('approved');
		expect(CATEGORIES).toContain('missed');
	});

	it('has correct order', () => {
		expect(CATEGORIES[0]).toBe('my');
		expect(CATEGORIES[1]).toBe('needsReview');
		expect(CATEGORIES[2]).toBe('requestedChanges');
		expect(CATEGORIES[3]).toBe('approved');
		expect(CATEGORIES[4]).toBe('missed');
	});
});