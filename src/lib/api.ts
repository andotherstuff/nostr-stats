const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'
const API_TOKEN = import.meta.env.VITE_API_TOKEN || ''

async function fetchApi<T>(endpoint: string): Promise<T> {
	const res = await fetch(`${API_URL}${endpoint}`, {
		headers: {
			Authorization: `Bearer ${API_TOKEN}`,
		},
	})

	if (!res.ok) {
		throw new Error(`API error: ${res.status} ${res.statusText}`)
	}

	return res.json()
}

// Types
export interface OverviewStats {
	total_events: number
	total_pubkeys: number
	total_kinds: number
	earliest_event: number
	latest_event: number
}

// Granular stats types
export interface CountResponse {
	count: number
}

export interface TimestampResponse {
	timestamp: number
}

export interface ActiveUsersCount {
	active_users: number
	has_profile: number
	has_follows_list: number
	has_profile_and_follows_list: number
	total_events: number
}

export interface ActiveUsersSummary {
	daily: ActiveUsersCount
	weekly: ActiveUsersCount
	monthly: ActiveUsersCount
}

export interface ActiveUsersRow {
	period: string
	active_users: number
	has_profile: number
	has_follows_list: number
	has_profile_and_follows_list: number
	total_events: number
}

export interface EventCountByPeriod {
	period: string
	count: number
	unique_pubkeys: number
}

export interface KindSummary {
	kind: number
	event_count: number
	unique_pubkeys: number
	first_seen: number
	last_seen: number
}

export interface KindDetail {
	kind: number
	event_count: number
	unique_pubkeys: number
	first_seen: number
	last_seen: number
	avg_content_length: number
	events_24h: number
	events_7d: number
	events_30d: number
}

// API functions
export function getOverview(): Promise<OverviewStats> {
	return fetchApi('/api/v1/stats')
}

// Granular stats endpoints (for independent loading)
export function getTotalEvents(): Promise<CountResponse> {
	return fetchApi('/api/v1/stats/events/total')
}

export function getTotalPubkeys(): Promise<CountResponse> {
	return fetchApi('/api/v1/stats/pubkeys/total')
}

export function getTotalKinds(): Promise<CountResponse> {
	return fetchApi('/api/v1/stats/kinds/total')
}

export function getEarliestEvent(): Promise<TimestampResponse> {
	return fetchApi('/api/v1/stats/events/earliest')
}

export function getLatestEvent(): Promise<TimestampResponse> {
	return fetchApi('/api/v1/stats/events/latest')
}

export function getActiveUsersSummary(): Promise<ActiveUsersSummary> {
	return fetchApi('/api/v1/stats/users/active')
}

export function getActiveUsersDaily(limit = 30): Promise<ActiveUsersRow[]> {
	return fetchApi(`/api/v1/stats/users/active/daily?limit=${limit}`)
}

export function getActiveUsersWeekly(limit = 12): Promise<ActiveUsersRow[]> {
	return fetchApi(`/api/v1/stats/users/active/weekly?limit=${limit}`)
}

export function getActiveUsersMonthly(limit = 12): Promise<ActiveUsersRow[]> {
	return fetchApi(`/api/v1/stats/users/active/monthly?limit=${limit}`)
}

export function getEventsByDay(days = 30): Promise<EventCountByPeriod[]> {
	return fetchApi(`/api/v1/stats/events?days=${days}&group_by=day`)
}

export function getEventsByWeek(limit = 12): Promise<EventCountByPeriod[]> {
	return fetchApi(`/api/v1/stats/events?group_by=week&limit=${limit}`)
}

export function getKinds(limit = 20): Promise<KindSummary[]> {
	return fetchApi(`/api/v1/kinds?limit=${limit}`)
}

export function getKindDetail(kind: number): Promise<KindDetail> {
	return fetchApi(`/api/v1/kinds/${kind}`)
}

export interface KindActivityRow {
	period: string
	event_count: number
	unique_pubkeys: number
}

export function getKindActivity(kind: number, limit = 30): Promise<KindActivityRow[]> {
	return fetchApi(`/api/v1/kinds/${kind}/activity?limit=${limit}`)
}

// Throughput (events per hour aggregate)
export interface ThroughputStats {
	events_per_hour: number
	total_events_7d: number
}

export function getThroughput(): Promise<ThroughputStats> {
	return fetchApi('/api/v1/stats/throughput')
}

// New users time series
export interface NewUsersRow {
	period: string
	new_users: number
}

export function getNewUsers(
	groupBy: 'day' | 'week' | 'month' = 'day',
	limit = 30
): Promise<NewUsersRow[]> {
	return fetchApi(`/api/v1/stats/users/new?group_by=${groupBy}&limit=${limit}`)
}

// User retention (cohort analysis)
export interface RetentionCohort {
	cohort: string
	cohort_size: number
	retention: number[]
	retention_pct: number[]
}

export function getUserRetention(
	cohortSize: 'week' | 'month' = 'week',
	limit = 12
): Promise<RetentionCohort[]> {
	return fetchApi(`/api/v1/stats/users/retention?cohort_size=${cohortSize}&limit=${limit}`)
}

// Hourly activity pattern
export interface HourlyActivityRow {
	hour: number
	event_count: number
	unique_pubkeys: number
	avg_per_day: number
}

export function getHourlyActivity(days = 7): Promise<HourlyActivityRow[]> {
	return fetchApi(`/api/v1/stats/activity/hourly?days=${days}`)
}

// Zap statistics
export interface ZapStatsAggregate {
	total_zaps: number
	total_sats: number
	unique_senders: number
	unique_recipients: number
	avg_zap_sats: number
}

export interface ZapStatsByPeriod {
	period: string
	total_zaps: number
	total_sats: number
	unique_senders: number
	unique_recipients: number
	avg_zap_sats: number
}

export function getZapStats(days = 30): Promise<ZapStatsAggregate> {
	return fetchApi(`/api/v1/stats/zaps?days=${days}`)
}

export function getZapStatsByDay(days = 30, limit = 30): Promise<ZapStatsByPeriod[]> {
	return fetchApi(`/api/v1/stats/zaps?days=${days}&group_by=day&limit=${limit}`)
}

// Zap histogram
export interface ZapHistogramBucket {
	bucket: string
	min_sats: number
	max_sats: number
	count: number
	total_sats: number
	pct_count: number
	pct_sats: number
}

export function getZapHistogram(days = 30): Promise<ZapHistogramBucket[]> {
	return fetchApi(`/api/v1/stats/zaps/histogram?days=${days}`)
}

// Engagement statistics
export interface EngagementStats {
	period_days: number
	original_notes: number
	replies: number
	reactions: number
	replies_per_note: number
	reactions_per_note: number
}

export function getEngagement(days = 30): Promise<EngagementStats> {
	return fetchApi(`/api/v1/stats/engagement?days=${days}`)
}

// Long-form content statistics
export interface LongformStats {
	articles_count: number
	unique_authors: number
	avg_content_length: number
	total_content_length: number
	estimated_total_words: number
}

export function getLongformStats(days?: number): Promise<LongformStats> {
	const params = days ? `?days=${days}` : ''
	return fetchApi(`/api/v1/stats/longform${params}`)
}

// Kind names for common event types (from NIPs)
export const KIND_NAMES: Record<number, string> = {
	// Core protocol (NIP-01, NIP-10)
	0: 'User Metadata',
	1: 'Short Text Note',
	2: 'Recommend Relay',
	3: 'Follows',
	4: 'Encrypted DM',
	5: 'Event Deletion',
	6: 'Repost',
	7: 'Reaction',
	8: 'Badge Award',
	9: 'Chat Message',
	10: 'Group Chat Reply',
	11: 'Thread',
	12: 'Group Thread Reply',
	13: 'Seal',
	14: 'Direct Message',
	15: 'File Message',
	16: 'Generic Repost',
	17: 'Reaction to Website',
	20: 'Picture',
	21: 'Video Event',
	22: 'Short Video',
	24: 'Public Message',
	// References (NKBIP-03)
	30: 'Internal Reference',
	31: 'External Web Reference',
	32: 'Hardcopy Reference',
	33: 'Prompt Reference',
	// Public Chat (NIP-28)
	40: 'Channel Creation',
	41: 'Channel Metadata',
	42: 'Channel Message',
	43: 'Channel Hide Message',
	44: 'Channel Mute User',
	// Misc
	62: 'Request to Vanish',
	64: 'Chess (PGN)',
	// Marmot Protocol
	443: 'Marmot KeyPackage',
	444: 'Marmot Welcome Message',
	445: 'Marmot Group Event',
	// Git (NIP-34)
	818: 'Merge Requests',
	// Polls (NIP-88)
	1018: 'Poll Response',
	// Marketplace (NIP-15)
	1021: 'Bid',
	1022: 'Bid Confirmation',
	// OpenTimestamps (NIP-03)
	1040: 'OpenTimestamps',
	// Gift Wrap (NIP-59)
	1059: 'Gift Wrap',
	// File Metadata (NIP-94)
	1063: 'File Metadata',
	// Poll (NIP-88)
	1068: 'Poll',
	// Comment (NIP-22)
	1111: 'Comment',
	// Voice Message (NIP-A0)
	1222: 'Voice Message',
	1244: 'Voice Message Comment',
	// Live Chat (NIP-53)
	1311: 'Live Chat Message',
	// Code Snippet (NIP-C0)
	1337: 'Code Snippet',
	// Git (NIP-34)
	1617: 'Patches',
	1618: 'Pull Requests',
	1619: 'Pull Request Updates',
	1621: 'Issues',
	1622: 'Git Replies',
	1630: 'Git Status',
	1631: 'Git Status',
	1632: 'Git Status',
	1633: 'Git Status',
	// Problem Tracker
	1971: 'Problem Tracker',
	// Reporting (NIP-56)
	1984: 'Reporting',
	// Label (NIP-32)
	1985: 'Label',
	1986: 'Relay Reviews',
	1987: 'AI Embeddings',
	// Torrents (NIP-35)
	2003: 'Torrent',
	2004: 'Torrent Comment',
	// Coinjoin
	2022: 'Coinjoin Pool',
	// Community (NIP-72)
	4550: 'Community Post Approval',
	// Job requests (NIP-90)
	5000: 'Job Request',
	5001: 'Job Request',
	5002: 'Job Request',
	5003: 'Job Request',
	5050: 'Job Request',
	5100: 'Job Request',
	5200: 'Job Request',
	5250: 'Job Request',
	5300: 'Job Request',
	5400: 'Job Request',
	5500: 'Job Request',
	5900: 'Job Request',
	5999: 'Job Request',
	// Job results (NIP-90)
	6000: 'Job Result',
	6001: 'Job Result',
	6002: 'Job Result',
	6003: 'Job Result',
	6050: 'Job Result',
	6100: 'Job Result',
	6200: 'Job Result',
	6250: 'Job Result',
	6300: 'Job Result',
	6400: 'Job Result',
	6500: 'Job Result',
	6600: 'Job Result',
	6666: 'Job Result',
	6900: 'Job Result',
	6999: 'Job Result',
	// Job Feedback (NIP-90)
	7000: 'Job Feedback',
	// Cashu Wallet (NIP-60)
	7374: 'Reserved Cashu Tokens',
	7375: 'Cashu Wallet Tokens',
	7376: 'Cashu Wallet History',
	// Geocaching
	7516: 'Geocache Log',
	7517: 'Geocache Proof',
	// Relay Access (NIP-43)
	8000: 'Add User',
	8001: 'Remove User',
	// Group Control (NIP-29)
	9000: 'Group Control',
	9001: 'Group Control',
	9002: 'Group Control',
	9003: 'Group Control',
	9004: 'Group Control',
	9005: 'Group Control',
	9006: 'Group Control',
	9007: 'Group Control',
	9008: 'Group Control',
	9021: 'Group Control',
	9022: 'Group Control',
	// Zap Goal (NIP-75)
	9041: 'Zap Goal',
	// Nutzap (NIP-61)
	9321: 'Nutzap',
	// Tidal
	9467: 'Tidal Login',
	// Zaps (NIP-57)
	9734: 'Zap Request',
	9735: 'Zap',
	// Highlights (NIP-84)
	9802: 'Highlights',
	// Lists (NIP-51)
	10000: 'Mute List',
	10001: 'Pin List',
	10002: 'Relay List Metadata',
	10003: 'Bookmark List',
	10004: 'Communities List',
	10005: 'Public Chats List',
	10006: 'Blocked Relays List',
	10007: 'Search Relays List',
	10009: 'User Groups',
	10012: 'Favorite Relays List',
	10013: 'Private Event Relay List',
	10015: 'Interests List',
	10019: 'Nutzap Mint Recommendation',
	10020: 'Media Follows',
	10030: 'User Emoji List',
	10050: 'DM Relays List',
	10051: 'KeyPackage Relays List',
	10063: 'User Server List',
	10096: 'File Storage Server List',
	10166: 'Relay Monitor Announcement',
	10312: 'Room Presence',
	10377: 'Proxy Announcement',
	11111: 'Transport Method',
	11998: 'DVM Subscription',
	// Wallet Info (NIP-47)
	13194: 'Wallet Info',
	// Membership Lists (NIP-43)
	13534: 'Membership Lists',
	// Corny Chat
	14388: 'User Sound Effect Lists',
	15555: 'DVM Subscription Filter',
	// Cashu Wallet Event (NIP-60)
	17375: 'Cashu Wallet Event',
	// Lightning.Pub
	21000: 'Lightning Pub RPC',
	// Client Auth (NIP-42)
	22242: 'Client Authentication',
	// DVM
	22456: 'DVM',
	22641: 'DVM',
	22790: 'DVM',
	22818: 'DVM',
	22832: 'DVM',
	22841: 'DVM',
	22852: 'DVM',
	22913: 'DVM',
	22969: 'DVM',
	// Wallet Connect (NIP-47)
	23194: 'Wallet Request',
	23195: 'Wallet Response',
	// Nostr Connect (NIP-46)
	24133: 'Nostr Connect',
	// Blossom
	24242: 'Blossom Blob',
	// DVM
	25050: 'DVM',
	// HTTP Auth (NIP-98)
	27235: 'HTTP Auth',
	// Relay Access (NIP-43)
	28934: 'Join Request',
	28935: 'Invite Request',
	28936: 'Leave Request',
	// Sets (NIP-51)
	30000: 'Follow Sets',
	30001: 'Generic Lists',
	30002: 'Relay Sets',
	30003: 'Bookmark Sets',
	30004: 'Curation Sets',
	30005: 'Video Sets',
	30006: 'Picture Sets',
	30007: 'Kind Mute Sets',
	30008: 'Profile Badges',
	30009: 'Badge Definition',
	30015: 'Interest Sets',
	// Marketplace (NIP-15)
	30017: 'Stall',
	30018: 'Product',
	30019: 'Marketplace UI/UX',
	30020: 'Auction Product',
	// Long-form Content (NIP-23)
	30023: 'Long-form Content',
	30024: 'Draft Long-form',
	// Emoji Sets (NIP-51)
	30030: 'Emoji Sets',
	// Curated Publication
	30040: 'Curated Publication Index',
	30041: 'Curated Publication Content',
	// Release Artifacts (NIP-51)
	30063: 'Release Artifact Sets',
	// App-specific Data (NIP-78)
	30078: 'Application-specific Data',
	// Relay Discovery (NIP-66)
	30166: 'Relay Discovery',
	// App Curation Sets (NIP-51)
	30267: 'App Curation Sets',
	// Live Activities (NIP-53)
	30311: 'Live Event',
	30312: 'Interactive Room',
	30313: 'Conference Event',
	// User Statuses (NIP-38)
	30315: 'User Statuses',
	// Corny Chat
	30388: 'Slide Set',
	// Classified Listings (NIP-99)
	30402: 'Classified Listing',
	30403: 'Draft Classified',
	// Git (NIP-34)
	30617: 'Repository Announcement',
	30618: 'Repository State',
	// Wiki (NIP-54)
	30818: 'Wiki Article',
	30819: 'Redirects',
	// Draft Events (NIP-37)
	31234: 'Draft Event',
	// Corny Chat
	31388: 'Link Set',
	// Custom Feeds
	31890: 'Feed',
	// Calendar (NIP-52)
	31922: 'Date-Based Calendar Event',
	31923: 'Time-Based Calendar Event',
	31924: 'Calendar',
	31925: 'Calendar Event RSVP',
	// Handler (NIP-89)
	31989: 'Handler Recommendation',
	31990: 'Handler Information',
	// Software Application
	32267: 'Software Application',
	// Corny Chat
	32388: 'User Room Favorites',
	33388: 'High Scores',
	34388: 'Sound Effects',
	// Community Definition (NIP-72)
	34550: 'Community Definition',
	// Geocache
	37516: 'Geocache Listing',
	// Cashu Mint (NIP-87)
	38172: 'Cashu Mint Announcement',
	38173: 'Fedimint Announcement',
	38225: 'DVM',
	// Peer-to-peer Orders (NIP-69)
	38383: 'Peer-to-peer Order',
	// Group Metadata (NIP-29)
	39000: 'Group Metadata',
	39001: 'Group Admins',
	39002: 'Group Members',
	39003: 'Group Roles',
	// Starter Packs (NIP-51)
	39089: 'Starter Packs',
	39092: 'Media Starter Packs',
	// Web Bookmarks (NIP-B0)
	39701: 'Web Bookmarks',
}

export function getKindName(kind: number): string {
	return KIND_NAMES[kind] || `Kind ${kind}`
}
