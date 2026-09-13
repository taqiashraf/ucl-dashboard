export function LiveIndicator({
  count,
  replay = false,
}: {
  count: number;
  replay?: boolean;
}) {
  if (count < 1) return null;
  return (
    <span
      className="live-pill"
      aria-label={`${count} ${count === 1 ? 'match' : 'matches'} in play${replay ? ' in historical replay' : ''}`}
    >
      <span className="live-dot" aria-hidden="true">
        <span className="live-ring" />
      </span>
      {replay ? 'Live replay' : 'LIVE'}
    </span>
  );
}
