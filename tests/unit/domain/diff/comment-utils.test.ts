import { findCommentableLine } from '../../../../src/domain/diff/comment-utils';

const line = (c: boolean) => ({ commentable: c });

describe('findCommentableLine', () => {
	it('returns null for empty lines', () => {
		expect(findCommentableLine([], 0)).toBeNull();
	});

	it('returns the line itself if commentable', () => {
		expect(findCommentableLine([line(false), line(true), line(false)], 1)).toBe(1);
	});

	it('finds nearest commentable line below cursor', () => {
		expect(findCommentableLine([line(false), line(false), line(true)], 0)).toBe(2);
	});

	it('finds nearest commentable line above cursor', () => {
		expect(findCommentableLine([line(true), line(false), line(false)], 2)).toBe(0);
	});

	it('prefers closer line below cursor', () => {
		expect(findCommentableLine([line(true), line(false), line(false), line(true)], 2)).toBe(3);
	});

	it('returns null when no commentable lines exist', () => {
		expect(findCommentableLine([line(false), line(false)], 0)).toBeNull();
	});

	it('handles cursor beyond lines by finding nearest above', () => {
		expect(findCommentableLine([line(true), line(false)], 10)).toBe(0);
	});
});