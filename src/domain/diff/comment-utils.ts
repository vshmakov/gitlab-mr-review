export interface CommentableLine {
	commentable: boolean;
}

/**
 * Find the nearest commentable line index from the cursor position,
 * searching outward in both directions.
 * Returns null if no commentable line is found.
 */
export function findCommentableLine(
	lines: readonly CommentableLine[],
	cursorLine: number,
): number | null {
	if (lines.length === 0) return null;

	const maxDistance = Math.max(cursorLine, lines.length - cursorLine);
	for (let distance = 0; distance <= maxDistance; distance++) {
		const idxBelow = cursorLine + distance;
		if (idxBelow < lines.length && lines[idxBelow].commentable) return idxBelow;

		const idxAbove = cursorLine - distance;
		if (idxAbove >= 0 && idxAbove < lines.length && lines[idxAbove].commentable) return idxAbove;
	}

	return null;
}