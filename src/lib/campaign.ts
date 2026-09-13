export interface CampaignAsset {
  id: string;
  partner: string;
  channel: string;
  asset: string;
  contracted: number;
  delivered: number;
  fee: number;
  impressions: number | null;
  engagements: number | null;
  clicks: number | null;
}
export function campaignMetrics(rows: CampaignAsset[]) {
  const fee = rows.reduce((s, r) => s + r.fee, 0);
  const tracked = rows.filter((r) => r.impressions !== null);
  const social = rows.filter(
    (r) =>
      r.channel === 'Social' &&
      r.impressions !== null &&
      r.engagements !== null,
  );
  const socialImpressions = social.reduce((s, r) => s + r.impressions!, 0);
  return {
    fee,
    fulfillment: fee
      ? rows.reduce(
          (s, r) =>
            s +
            r.fee * Math.min(1, r.contracted ? r.delivered / r.contracted : 0),
          0,
        ) / fee
      : null,
    gaps: rows.filter((r) => r.delivered < r.contracted),
    impressions: tracked.reduce((s, r) => s + r.impressions!, 0),
    tracked: tracked.length,
    socialRate: socialImpressions
      ? social.reduce((s, r) => s + r.engagements!, 0) / socialImpressions
      : null,
  };
}
