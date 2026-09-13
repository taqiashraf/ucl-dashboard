import { useState } from 'react';
import campaign from '../../public/case-study/campaign.json';
import { campaignMetrics } from '../lib/campaign';
const money = (n: number) =>
  n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
export function PartnerCaseStudy() {
  const [partner, setPartner] = useState('all');
  const rows = campaign.assets.filter(
      (r) => partner === 'all' || r.partner === partner,
    ),
    metrics = campaignMetrics(rows);
  const recommendation = metrics.gaps.length
    ? `Resolve ${metrics.gaps.length} underdelivered asset lines before renewal discussions. Agree a dated make-good plan with the partner; confirm any fee adjustment against contract terms.`
    : 'All selected asset lines meet contracted unit counts. Confirm delivery evidence and partner objectives before making a renewal recommendation.';
  function recap() {
    const content = `# ${campaign.title}\n\n${campaign.status}\n\nScope: ${partner}\nContract fees: ${money(metrics.fee)}\nFee-weighted fulfillment: ${metrics.fulfillment === null ? 'Unavailable' : (metrics.fulfillment * 100).toFixed(1) + '%'}\nTracked gross impressions: ${metrics.impressions.toLocaleString()} across ${metrics.tracked}/${rows.length} assets\n\n## Recommended action\n${recommendation}\n\n${rows.map((r) => `- ${r.partner}, ${r.asset}: ${r.delivered}/${r.contracted} units delivered; allocated fee ${money(r.fee)}`).join('\n')}\n\n## Limitations\nSynthetic data, not actual partner performance. Fulfillment = sum(allocated fee × min(delivered/contracted, 1)) / total fee. Impressions are gross, not deduplicated reach. Social engagement rate uses only social rows with both impressions and engagements. No revenue attribution or ROI is claimed.\n`;
    const url = URL.createObjectURL(
      new Blob([content], { type: 'text/markdown' }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample-partner-recap.md';
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <div className="partner-case">
      <div className="bi-notice">
        <strong>Portfolio exercise · synthetic data</strong>
        <p>
          Practice a partner review using fictional campaign records. These
          numbers are separate from the real football feed.
        </p>
      </div>
      <div className="bi-filters">
        <label>
          Partner
          <select value={partner} onChange={(e) => setPartner(e.target.value)}>
            <option value="all">All sample partners</option>
            {[...new Set(campaign.assets.map((r) => r.partner))].map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </label>
        <button className="bi-button" onClick={recap}>
          Download partner recap
        </button>
      </div>
      <h3>Did we deliver what the partner bought?</h3>
      <div className="bi-kpis">
        {[
          [
            'Contract fees',
            money(metrics.fee),
            'Fictional allocated fees, USD',
          ],
          [
            'Delivery score',
            `${((metrics.fulfillment ?? 0) * 100).toFixed(1)}%`,
            'Fee-weighted; overdelivery capped at 100% per asset',
          ],
          [
            'Needs attention',
            String(metrics.gaps.length),
            'Asset lines below contracted units',
          ],
          [
            'Social engagement',
            metrics.socialRate === null
              ? '—'
              : `${(metrics.socialRate * 100).toFixed(1)}%`,
            'Social engagements / social impressions',
          ],
        ].map(([label, value, note]) => (
          <article className="bi-kpi" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
            <small>{note}</small>
          </article>
        ))}
      </div>
      <div className="bi-takeaway">
        <div>
          <h3>Recommended next action</h3>
          <p>{recommendation}</p>
        </div>
      </div>
      <div
        className="table-scroll"
        tabIndex={0}
        aria-label="Sample partnership deliverables"
      >
        <table className="comparison-table">
          <caption>Fictional asset delivery ledger</caption>
          <thead>
            <tr>
              <th>Partner / asset</th>
              <th>Delivered / contracted</th>
              <th>Allocated fee</th>
              <th>Gross impressions</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <th>
                  {r.partner}
                  <br />
                  <small>
                    {r.asset} · {r.channel}
                  </small>
                </th>
                <td>
                  {r.delivered} / {r.contracted}
                </td>
                <td>{money(r.fee)}</td>
                <td>{r.impressions?.toLocaleString() ?? 'Not measured'}</td>
                <td>
                  {r.delivered < r.contracted
                    ? `Make good ${r.contracted - r.delivered} ${r.contracted - r.delivered === 1 ? 'unit' : 'units'}`
                    : 'Confirm evidence'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="section-note">
        Gross impressions: {metrics.impressions.toLocaleString()} from{' '}
        {metrics.tracked}/{rows.length} asset lines. Missing audience values are
        excluded, not treated as zero. These counts do not measure unique reach
        or sales lift.
      </p>
      <details className="bi-methodology">
        <summary>How the delivery score works</summary>
        <p>
          For each asset, divide delivered units by contracted units and cap at
          100%. Weight that percentage by its allocated fee, then divide by
          total fees. This helps prioritize expensive shortfalls while
          preventing extra social posts from concealing a missed hospitality
          commitment. It is an analyst-designed summary, not a contractual
          settlement amount.
        </p>
        <p>
          All assumptions and source records are downloadable:{' '}
          <a href="/case-study/campaign.json" download>
            sample dataset
          </a>
          .{' '}
          <a href="/case-study/asset-delivery.csv" download>
            Excel-ready asset ledger
          </a>
          . A SQL reporting model is included in the project’s analytics folder.
        </p>
      </details>
    </div>
  );
}
