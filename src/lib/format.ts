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
