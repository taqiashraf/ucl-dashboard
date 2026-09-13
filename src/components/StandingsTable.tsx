import type { StandingRow } from '../types';
import { Crest } from './Crest';
export function StandingsTable({
  rows,
  compact = false,
  historical = false,
}: {
  rows: StandingRow[];
  compact?: boolean;
  historical?: boolean;
}) {
  return (
    <>
      <div
        className={`table-scroll ${historical ? 'historical-table' : ''} ${compact ? 'compact-table' : ''}`}
        tabIndex={0}
        aria-label="League standings, scroll for more teams"
      >
        <table>
          <caption className="sr-only">
            Champions League league-phase standings
          </caption>
          <thead>
            <tr>
              <th scope="col" className="rank">
                #
              </th>
              <th scope="col" className="sticky-team">
                Club
              </th>
              <th scope="col">
                <abbr title="Played">P</abbr>
              </th>
              {!compact && (
                <>
                  <th scope="col">
                    <abbr title="Won">W</abbr>
                  </th>
                  <th scope="col">
                    <abbr title="Drawn">D</abbr>
                  </th>
                  <th scope="col">
                    <abbr title="Lost">L</abbr>
                  </th>
                  <th scope="col">
                    <abbr title="Goals for">GF</abbr>
                  </th>
                  <th scope="col">
                    <abbr title="Goals against">GA</abbr>
                  </th>
                </>
              )}
              <th scope="col">
                <abbr title="Goal difference">GD</abbr>
              </th>
              <th scope="col">Pts</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.team.id}
                className={
                  row.position <= 8
                    ? 'band-direct'
                    : row.position <= 24
                      ? 'band-playoff'
                      : 'band-out'
                }
              >
                <td className="rank">{row.position}</td>
                <th scope="row" className="sticky-team">
                  <span className="table-team">
                    <Crest team={row.team} />
                    <span>{row.team.shortName}</span>
                  </span>
                </th>
                <td>{row.played}</td>
                {!compact && (
                  <>
                    <td>{row.won}</td>
                    <td>{row.drawn}</td>
                    <td>{row.lost}</td>
                    <td>{row.goalsFor}</td>
                    <td>{row.goalsAgainst}</td>
                  </>
                )}
                <td className="quiet">
                  {row.goalDifference > 0 ? '+' : ''}
                  {row.goalDifference}
                </td>
                <td className="points">{row.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!historical && (
        <div className="table-legend">
          <span>
            <i className="direct-key" />
            1–8 Round of 16
          </span>
          <span>
            <i className="playoff-key" />
            9–24 Play-offs
          </span>
          <span>25–36 Outside qualification</span>
        </div>
      )}
    </>
  );
}
