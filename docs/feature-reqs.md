# Feature Requests for Pensieve API

This document tracks additional metrics and endpoints that would enhance the nostr-stats dashboard.

## High Priority

### 1. Event Throughput Metrics
- **Endpoint**: `GET /api/v1/stats/throughput`
- **Description**: Real-time event ingestion rate (events per second/minute)
- **Use case**: Show live activity indicator, detect network spikes or outages

### 2. User Retention Cohorts
- **Endpoint**: `GET /api/v1/stats/users/retention`
- **Description**: Cohort analysis showing how many users from week N are still active in week N+1, N+2, etc.
- **Params**: `cohort_start` (date), `cohort_size` (week/month), `limit` (number of cohorts)
- **Use case**: Understand user stickiness and growth quality
- **Note**: These should filter out events where throwaway keys are used like 1059 and 445

### 3. New Users Time Series
- **Endpoint**: `GET /api/v1/stats/users/new`
- **Description**: Count of pubkeys seen for the first time, grouped by day/week/month
- **Params**: `group_by`, `limit`, `since`
- **Use case**: Track network growth rate, separate from active users
- **Note**: These should filter out events where throwaway keys are used like 1059 and 445

---

## Medium Priority

### 5. Hourly Activity Pattern
- **Endpoint**: `GET /api/v1/stats/activity/hourly`
- **Description**: Events grouped by hour of day (0-23) to show usage patterns
- **Params**: `days` (aggregate over N days), `kind` (optional filter)
- **Use case**: Visualize when the network is most active

### 7. Zap Statistics
- **Endpoint**: `GET /api/v1/stats/zaps`
- **Description**: Aggregate zap statistics
- **Response**:
  - `total_zaps` (count of kind 9735)
  - `total_sats` (sum of amounts)
  - `unique_zappers` (unique sender pubkeys)
  - `unique_recipients` (unique receiver pubkeys)
  - `avg_zap_amount`
- **Params**: `days`, `group_by`
- **Use case**: Track economic activity on the network

### 8. Reply/Reaction Ratio
- **Endpoint**: `GET /api/v1/stats/engagement`
- **Description**: Ratio of replies (kind 1 with e-tag) and reactions (kind 7) to original notes
- **Use case**: Measure engagement quality

---

## Lower Priority

### 9. Long-form Content Stats
- **Endpoint**: `GET /api/v1/stats/longform`
- **Description**: Statistics specific to kind 30023 (long-form) content
- **Response**: `{ articles_count, unique_authors, avg_word_count, total_words }`
- **Use case**: Track growth of long-form content ecosystem

### 10. Top Publishers
- **Endpoint**: `GET /api/v1/stats/publishers`
- **Description**: Pubkeys with highest event counts
- **Params**: `kind` (optional), `days`, `limit`
- **Response**: Array of `{ pubkey, event_count, kinds_used }`
- **Use case**: Identify power users and potential spam/bot accounts

### 12. NIP Adoption Metrics
- **Endpoint**: `GET /api/v1/stats/nips`
- **Description**: Track adoption of various NIPs based on kind usage
- **Response**: Array of `{ nip, kinds, adoption_percent, trend }`
- **Use case**: Visualize protocol evolution and NIP adoption
---

## Implementation Notes

When implementing these endpoints, consider:

1. **Caching**: Many of these can be cached for 1-5 minutes
2. **Materialized Views**: Heavy aggregations should use ClickHouse materialized views
3. **Rate Limiting**: Per-endpoint rate limits for expensive queries
4. **Pagination**: For any list endpoints returning potentially large datasets

