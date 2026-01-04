/**
 * Format a number with appropriate suffix (K, M, B)
 */
export function formatNumber(num: number): string {
	if (num >= 1_000_000_000) {
		return `${(num / 1_000_000_000).toFixed(2)}B`
	}
	if (num >= 1_000_000) {
		return `${(num / 1_000_000).toFixed(2)}M`
	}
	if (num >= 1_000) {
		return `${(num / 1_000).toFixed(1)}K`
	}
	return num.toLocaleString()
}

/**
 * Format a number with commas
 */
export function formatNumberWithCommas(num: number): string {
	return num.toLocaleString()
}

/**
 * Format a Unix timestamp to a readable date
 */
export function formatDate(timestamp: number): string {
	if (!timestamp) return 'N/A'
	const date = new Date(timestamp * 1000)
	return date.toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	})
}

/**
 * Format a Unix timestamp to a relative time string
 */
export function formatRelativeTime(timestamp: number): string {
	if (!timestamp) return 'N/A'
	const now = Date.now() / 1000
	const diff = now - timestamp

	if (diff < 60) return 'just now'
	if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
	if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
	if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`

	return formatDate(timestamp)
}

/**
 * Calculate percentage change between two values
 */
export function percentChange(current: number, previous: number): number {
	if (previous === 0) return current > 0 ? 100 : 0
	return ((current - previous) / previous) * 100
}

/**
 * Format percentage with sign
 */
export function formatPercent(value: number): string {
	const sign = value >= 0 ? '+' : ''
	return `${sign}${value.toFixed(1)}%`
}

/**
 * Format sats with BTC conversion for amounts >= 1 BTC
 * Under 1 BTC: shows sats with K/M suffix (e.g., "500K sats", "50.5M sats")
 * 1 BTC or more: shows BTC with 2 decimal places (e.g., "1.00 BTC", "2.50 BTC")
 */
export function formatSats(sats: number): string {
	const SATS_PER_BTC = 100_000_000

	if (sats >= SATS_PER_BTC) {
		const btc = sats / SATS_PER_BTC
		return `${btc.toFixed(2)} BTC`
	}

	// Under 1 BTC, show in sats with appropriate suffix
	if (sats >= 1_000_000) {
		return `${(sats / 1_000_000).toFixed(2)}M sats`
	}
	if (sats >= 1_000) {
		return `${(sats / 1_000).toFixed(1)}K sats`
	}
	return `${sats.toLocaleString()} sats`
}
