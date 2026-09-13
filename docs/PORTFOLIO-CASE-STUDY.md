# Matchday: a partnerships BI case study

## Business question

How can a partnerships analyst turn competition data into an activation calendar and a defensible reporting baseline, while identifying the missing inputs for commercial valuation?

## Interview walkthrough

1. Open Insights and explain the dataset, time coverage and club filter. Separate completed results from future fixtures.
2. Use the calendar to identify busy delivery periods. Confirm contracted rights, broadcast markets and partner deadlines before committing activation resources.
3. Inspect club scoring and player contributions as content research leads. Football output does not establish audience, brand exposure or purchase intent.
4. Review data quality. Null assists remain unknown, not zero; the top-goalscorer sample is not an all-player assist ranking.
5. Export measured KPIs to Excel. Explain the denominator, source and timestamp columns before presenting a conclusion.
6. Change the illustrative CPM, impressions and quality assumptions. Discuss sensitivity and explain why media-equivalent value is not ROI.

## Metric dictionary

| Metric                   | Calculation                                                              | Interpretation / limitation                                     |
| ------------------------ | ------------------------------------------------------------------------ | --------------------------------------------------------------- |
| Completed matches        | Count of FINISHED records in scope                                       | Returned dataset coverage; not a guarantee of a complete season |
| Score coverage           | Completed records with both scores / completed records                   | Missing scores excluded from rates                              |
| Goals per match          | Both teams’ goals / scored completed matches                             | Football performance, not engagement                            |
| Close result share       | Scored matches with final goal difference ≤ 1 / scored matches           | Includes draws; no causal audience claim                        |
| Scheduled fixtures       | TIMED + SCHEDULED records                                                | Dates for planning, not confirmed sponsorship inventory         |
| Player contributions     | Goals + assists for players with non-null assists                        | Top 20 goalscorers only; missing players excluded               |
| Modeled media equivalent | Assumed gross impressions / 1,000 × assumed CPM × assumed quality factor | Illustrative USD equivalent; not actual campaign value          |
| Fee coverage             | Modeled media equivalent / proposed rights fee                           | Not revenue, profit or ROI; undefined at zero fee               |

## What a commercial measurement layer needs next

Attendance requires a documented source and definition (distributed tickets versus entries). Actual ticket yield requires transactions, refunds, fees, tax treatment and currency. Listing prices and stadium capacity are not substitutes.

A sponsorship dataset should contain campaign, partner, asset, match, channel, exposure duration, visibility assessment, impression definition, engagements, contracted deliverables, delivered units, fees and source timestamps. Add authorized exports before investing in another API. Verify rights to store and analyze the data.

Broadcast and social impressions should not be added and labeled unique reach without deduplication. Valuation benchmarks need source, market, channel, date and currency. Attribution or sales-lift claims need an appropriate comparison design, not just post-campaign sales.

Salesforce opportunities and renewals can later join via partner/campaign identifiers. This project currently has no CRM connection and should not be represented as Salesforce experience. Similarly, a React dashboard is not evidence of Power BI/Tableau proficiency.

## Suggested next portfolio deliverables

- A small, clearly labeled synthetic campaign dataset for asset fulfillment, channel performance and partner recaps; keep it separate from real match data.
- A SQL model with fact_match, fact_exposure, fact_deliverable and dimension tables, plus reconciliation queries.
- An Excel reconciliation workbook and a five-slide partner recap: objective, KPI performance, drivers, limitations, recommended next action.
- A Power BI report using that same model, with documented refresh and data-quality checks.

These are future work, not capabilities already delivered. The current project demonstrates API ingestion, normalization, defensive reporting, visualization, scenario analysis and export.

## Reference

[Relo Metrics explains media exposure and valuation](https://blog.relometrics.com/beyond-exposure). Its system measures exposure attributes and audience data; this independent portfolio does not replicate its proprietary measurement infrastructure.

## Implemented partner-review exercise

The Insights “Review a partner” view now includes fictional partners, a delivery ledger, fee-weighted fulfillment, social engagement rate, explicit missing audience coverage, underdelivery actions and a downloadable Markdown recap. Data is labeled synthetic in the interface and export. The SQL model in `analytics/partner-report.sql` is reconciled by `python3 scripts/check-analytics.py`; the downloadable CSV can be opened in Excel. An Excel workbook, Power BI report, Salesforce integration and PowerPoint deck remain future deliverables.

For a recruiter, demonstrate the Northstar Travel filter: $24,000 allocated fees, 79.2% weighted fulfillment, two underdelivered assets and 4.0% social engagement. Explain why excess delivery on one asset cannot offset an unrelated missed obligation. Then download the recap and show the source ledger and SQL checks.

For football context, recent match briefs compare goals with other games in the selected snapshot and show up to five prior results. They make no claim that football performance causes sponsor exposure or sales.
