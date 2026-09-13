import type { Match } from '../types';
import { summarizeMatches } from '../lib/insights';
export function MatchAnalysis({
  match,
  context,
}: {
  match: Match;
  context: Match[];
}) {
  const finished =
    match.status === 'FINISHED' &&
    match.score.home !== null &&
    match.score.away !== null;
  const baseline = summarizeMatches(context.filter((m) => m.id !== match.id));
  const goals = finished ? match.score.home! + match.score.away! : null;
  const form = (id: number) => {
    const previous = context
      .filter(
        (m) =>
          m.status === 'FINISHED' &&
          m.utcDate < match.utcDate &&
          (m.home.id === id || m.away.id === id) &&
          m.score.home !== null &&
          m.score.away !== null,
      )
      .sort((a, b) => b.utcDate.localeCompare(a.utcDate))
      .slice(0, 5);
    return previous.map((m) => {
      const own = m.home.id === id ? m.score.home! : m.score.away!,
        opp = m.home.id === id ? m.score.away! : m.score.home!;
      return own > opp ? 'W' : own === opp ? 'D' : 'L';
    });
  };
  return (
    <section className="match-analysis">
      <h3>Match brief</h3>
      <p className="section-note">
        Football evidence for a content or partner recap. Audience and
        commercial outcomes require separate measurements.
      </p>
      <dl className="detail-facts">
        <div>
          <dt>Total goals</dt>
          <dd>{goals ?? 'Available after full time'}</dd>
        </div>
        <div>
          <dt>Other completed games: average goals</dt>
          <dd>
            {baseline.goalsPerMatch?.toFixed(2) ?? 'Not enough data'} (
            {baseline.scored} games)
          </dd>
        </div>
        {[match.home, match.away].map((t) => (
          <div key={t.id}>
            <dt>{t.shortName}: preceding results</dt>
            <dd>
              {form(t.id).join(' · ') || 'No earlier results in this dataset'}
            </dd>
          </div>
        ))}
      </dl>
      <p>
        {goals !== null && baseline.goalsPerMatch !== null
          ? `This match had ${Math.abs(goals - baseline.goalsPerMatch).toFixed(2)} ${goals >= baseline.goalsPerMatch ? 'more' : 'fewer'} goals than the other completed games in this dataset, on average. `
          : ''}
        {finished
          ? 'Use the result and available form as the factual opening of a recap. Then measure the reach, engagement and delivery of the partner content produced around it.'
          : 'Use the fixture to plan content and delivery deadlines. Record actual performance after the match.'}
      </p>
      <p className="section-note">
        Comparison uses the selected dataset, including later results where
        present; it is not an as-of-match forecast. Form shows up to five
        earlier matches, newest first. W = win, D = draw, L = loss. Neither
        goals nor close scores establish sponsor exposure or sales lift.
      </p>
    </section>
  );
}
