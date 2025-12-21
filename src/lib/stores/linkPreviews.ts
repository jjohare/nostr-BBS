/**
 * Link preview store with caching
 * Fetches OpenGraph metadata for URLs
 */

import { writable, get } from 'svelte/store';

export interface LinkPreviewData {
	url: string;
	title?: string;
	description?: string;
	image?: string;
	siteName?: string;
	domain: string;
	favicon?: string;
	error?: boolean;
	// Twitter/X specific
	type?: 'opengraph' | 'twitter';
	html?: string; // Twitter embed HTML
	authorName?: string;
	authorUrl?: string;
}

interface PreviewCache {
	[url: string]: {
		data: LinkPreviewData;
		timestamp: number;
	};
}

const CACHE_KEY = 'nostr_bbs_link_previews';
const CACHE_DURATION = 10 * 24 * 60 * 60 * 1000; // 10 days
const MAX_CACHE_SIZE = 100;

// Load cache from localStorage
function loadCache(): PreviewCache {
	try {
		const cached = localStorage.getItem(CACHE_KEY);
		if (!cached) return {};

		const parsed = JSON.parse(cached);
		const now = Date.now();

		// Filter expired entries
		const filtered: PreviewCache = {};
		for (const [url, entry] of Object.entries(parsed)) {
			const cacheEntry = entry as PreviewCache[string];
			if (now - cacheEntry.timestamp < CACHE_DURATION) {
				filtered[url] = cacheEntry;
			}
		}

		return filtered;
	} catch {
		return {};
	}
}

// Save cache to localStorage
function saveCache(cache: PreviewCache): void {
	try {
		// Limit cache size
		const entries = Object.entries(cache);
		if (entries.length > MAX_CACHE_SIZE) {
			// Keep only the most recent entries
			entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
			cache = Object.fromEntries(entries.slice(0, MAX_CACHE_SIZE));
		}

		localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
	} catch (error) {
		console.warn('Failed to save link preview cache:', error);
	}
}

// In-memory cache
const previewCache = writable<PreviewCache>(loadCache());

// Subscribe to cache changes and persist
previewCache.subscribe(cache => {
	saveCache(cache);
});

/**
 * Check if URL is Twitter/X
 */
function isTwitterUrl(url: string): boolean {
	try {
		const parsed = new URL(url);
		return ['twitter.com', 'x.com', 'www.twitter.com', 'www.x.com', 'mobile.twitter.com', 'mobile.x.com'].includes(parsed.hostname);
	} catch {
		return false;
	}
}

/**
 * Fetch preview data for a URL
 * Uses the proxy endpoint for CORS-free fetching and Twitter oEmbed support
 */
export async function fetchPreview(url: string): Promise<LinkPreviewData> {
	// Check cache first
	const cache = get(previewCache);
	if (cache[url]) {
		return cache[url].data;
	}

	// Extract domain for fallback
	const domain = new URL(url).hostname.replace(/^www\./, '');
	const favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;

	try {
		// Use proxy endpoint for fetching
		const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
		const response = await fetch(proxyUrl, {
			method: 'GET',
			headers: {
				'Accept': 'application/json',
			},
			signal: AbortSignal.timeout(15000), // 15 second timeout for proxy
		});

		if (!response.ok) {
			throw new Error(`Proxy returned ${response.status}`);
		}

		const data = await response.json();

		// Handle Twitter/X embeds
		if (data.type === 'twitter') {
			const preview: LinkPreviewData = {
				url,
				domain,
				favicon: 'https://abs.twimg.com/favicons/twitter.3.ico',
				type: 'twitter',
				html: data.html,
				title: data.author_name ? `Post by ${data.author_name}` : 'X Post',
				authorName: data.author_name,
				authorUrl: data.author_url,
				siteName: data.provider_name || 'X',
			};

			// Cache the result
			previewCache.update(cache => {
				cache[url] = {
					data: preview,
					timestamp: Date.now(),
				};
				return cache;
			});

			return preview;
		}

		// Handle OpenGraph data
		const preview: LinkPreviewData = {
			url: data.url || url,
			domain: data.domain || domain,
			favicon: data.favicon || favicon,
			title: data.title,
			description: data.description,
			image: data.image,
			siteName: data.siteName,
			type: 'opengraph',
		};

		// Cache the result
		previewCache.update(cache => {
			cache[url] = {
				data: preview,
				timestamp: Date.now(),
			};
			return cache;
		});

		return preview;
	} catch (error) {
		console.warn('Failed to fetch preview for', url, error);

		// Fallback: Try direct fetch for same-origin or CORS-enabled URLs
		try {
			const response = await fetch(url, {
				method: 'GET',
				headers: {
					'Accept': 'text/html',
				},
				signal: AbortSignal.timeout(5000),
			});

			if (response.ok) {
				const html = await response.text();
				const preview = parseOpenGraphTags(html, url);
				preview.type = 'opengraph';

				previewCache.update(cache => {
					cache[url] = {
						data: preview,
						timestamp: Date.now(),
					};
					return cache;
				});

				return preview;
			}
		} catch {
			// Direct fetch also failed
		}

		// Create fallback preview
		const fallback: LinkPreviewData = {
			url,
			domain,
			favicon,
			error: true,
		};

		// Cache the error result
		previewCache.update(cache => {
			cache[url] = {
				data: fallback,
				timestamp: Date.now(),
			};
			return cache;
		});

		return fallback;
	}
}

/**
 * Parse OpenGraph tags from HTML
 */
function parseOpenGraphTags(html: string, url: string): LinkPreviewData {
	const domain = new URL(url).hostname.replace(/^www\./, '');
	const favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;

	const preview: LinkPreviewData = {
		url,
		domain,
		favicon,
	};

	// Extract og:title
	const titleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i);
	if (titleMatch) {
		preview.title = decodeHtmlEntities(titleMatch[1]);
	}

	// Fallback to <title> tag
	if (!preview.title) {
		const titleTagMatch = html.match(/<title>([^<]+)<\/title>/i);
		if (titleTagMatch) {
			preview.title = decodeHtmlEntities(titleTagMatch[1]);
		}
	}

	// Extract og:description
	const descMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i);
	if (descMatch) {
		preview.description = decodeHtmlEntities(descMatch[1]);
	}

	// Fallback to meta description
	if (!preview.description) {
		const metaDescMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
		if (metaDescMatch) {
			preview.description = decodeHtmlEntities(metaDescMatch[1]);
		}
	}

	// Extract og:image
	const imageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
	if (imageMatch) {
		preview.image = resolveUrl(imageMatch[1], url);
	}

	// Extract og:site_name
	const siteMatch = html.match(/<meta\s+property=["']og:site_name["']\s+content=["']([^"']+)["']/i);
	if (siteMatch) {
		preview.siteName = decodeHtmlEntities(siteMatch[1]);
	}

	return preview;
}

/**
 * Decode HTML entities safely without using innerHTML
 * Prevents XSS attacks from malicious HTML entities
 */
function decodeHtmlEntities(text: string): string {
	// Common HTML entities mapping
	const entities: Record<string, string> = {
		'&amp;': '&',
		'&lt;': '<',
		'&gt;': '>',
		'&quot;': '"',
		'&#39;': "'",
		'&apos;': "'",
		'&nbsp;': ' ',
		'&copy;': '©',
		'&reg;': '®',
		'&trade;': '™',
		'&mdash;': '—',
		'&ndash;': '–',
		'&hellip;': '…',
		'&lsquo;': ''',
		'&rsquo;': ''',
		'&ldquo;': '"',
		'&rdquo;': '"',
	};

	// Replace named entities
	let decoded = text;
	for (const [entity, char] of Object.entries(entities)) {
		decoded = decoded.replace(new RegExp(entity, 'gi'), char);
	}

	// Replace numeric entities (&#123; or &#x7B;)
	decoded = decoded.replace(/&#(\d+);/g, (_, num) => {
		const code = parseInt(num, 10);
		return code > 0 && code < 0x10FFFF ? String.fromCodePoint(code) : '';
	});

	decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
		const code = parseInt(hex, 16);
		return code > 0 && code < 0x10FFFF ? String.fromCodePoint(code) : '';
	});

	return decoded;
}

/**
 * Resolve relative URLs to absolute
 */
function resolveUrl(relativeUrl: string, baseUrl: string): string {
	try {
		return new URL(relativeUrl, baseUrl).href;
	} catch {
		return relativeUrl;
	}
}

/**
 * Get cached preview if available
 */
export function getCachedPreview(url: string): LinkPreviewData | null {
	const cache = get(previewCache);
	return cache[url]?.data || null;
}

/**
 * Clear preview cache
 */
export function clearPreviewCache(): void {
	previewCache.set({});
	localStorage.removeItem(CACHE_KEY);
}
