import { useState } from 'react';
import type { TeamRef } from '../types';
export function Crest({ team }: { team: TeamRef }) {
  const [failed, setFailed] = useState<string | null>(null);
  return team.crest && failed !== team.crest ? (
    <img
      className="crest"
      src={team.crest}
      alt=""
      width={28}
      height={28}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(team.crest)}
    />
  ) : (
    <span className="crest monogram" aria-hidden="true">
      {team.tla.slice(0, 3)}
    </span>
  );
}
