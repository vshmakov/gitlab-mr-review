/** Removes leading/trailing whitespace and trailing slashes from a URL. */
export function normalizeBaseUrl(url: string): string {
	return url.trim().replace(/\/+$/, '');
}