export function Skeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div
      role="status"
      aria-label="Loading match data"
      className="skeleton-list"
    >
      <span className="sr-only">Loading match data</span>
      {Array.from({ length: rows }, (_, i) => (
        <div className="skeleton-row" key={i}>
          <span />
          <span />
          <span />
        </div>
      ))}
    </div>
  );
}
