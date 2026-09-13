-- SQLite-compatible portfolio example. All rows come from the explicitly
-- synthetic public/case-study/campaign.json dataset, never actual partner data.
CREATE TABLE IF NOT EXISTS asset_delivery (
 id TEXT PRIMARY KEY, partner TEXT NOT NULL, channel TEXT NOT NULL,
 asset TEXT NOT NULL, contracted INTEGER NOT NULL CHECK(contracted > 0),
 delivered INTEGER NOT NULL CHECK(delivered >= 0), fee REAL NOT NULL CHECK(fee >= 0),
 impressions INTEGER CHECK(impressions >= 0), engagements INTEGER CHECK(engagements >= 0),
 clicks INTEGER CHECK(clicks >= 0)
);
CREATE VIEW IF NOT EXISTS partner_recap AS
SELECT partner,
 SUM(fee) AS allocated_fees_usd,
 SUM(fee * MIN(1.0, 1.0 * delivered / contracted)) / NULLIF(SUM(fee),0) AS fee_weighted_fulfillment,
 SUM(CASE WHEN delivered < contracted THEN 1 ELSE 0 END) AS underdelivered_asset_lines,
 SUM(impressions) AS tracked_gross_impressions,
 COUNT(impressions) AS assets_with_impressions,
 COUNT(*) AS total_assets,
 1.0 * SUM(CASE WHEN channel='Social' AND impressions IS NOT NULL AND engagements IS NOT NULL THEN engagements END)
 / NULLIF(SUM(CASE WHEN channel='Social' AND impressions IS NOT NULL AND engagements IS NOT NULL THEN impressions END),0) AS social_engagement_rate
FROM asset_delivery GROUP BY partner;
SELECT * FROM partner_recap;
-- Reconciliation: each asset must join to one partner exactly once. Repeated
-- impressions are not deduplicated people; fee coverage does not imply ROI.
