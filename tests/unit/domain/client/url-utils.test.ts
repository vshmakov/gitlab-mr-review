import { normalizeBaseUrl } from '../../../../src/domain/client/url-utils';

describe('normalizeBaseUrl', () => {
	it('removes single trailing slash', () => {
		expect(normalizeBaseUrl('https://gitlab.com/')).toBe('https://gitlab.com');
	});

	it('removes multiple trailing slashes', () => {
		expect(normalizeBaseUrl('https://gitlab.com///')).toBe('https://gitlab.com');
	});

	it('trims whitespace', () => {
		expect(normalizeBaseUrl('  https://gitlab.com  ')).toBe('https://gitlab.com');
	});

	it('trims and removes trailing slash', () => {
		expect(normalizeBaseUrl('  https://gitlab.com/  ')).toBe('https://gitlab.com');
	});

	it('leaves url without trailing slash unchanged', () => {
		expect(normalizeBaseUrl('https://gitlab.com')).toBe('https://gitlab.com');
	});

	it('handles empty string', () => {
		expect(normalizeBaseUrl('')).toBe('');
	});

	it('handles whitespace only', () => {
		expect(normalizeBaseUrl('   ')).toBe('');
	});
});