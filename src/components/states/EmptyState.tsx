import { CalendarDays } from 'lucide-react';
export function EmptyState({
  message = 'No Champions League matches in this window. The schedule will update when the next fixtures are available.',
}: {
  message?: string;
}) {
  return (
    <div className="empty-state">
      <CalendarDays size={25} />
      <p>{message}</p>
    </div>
  );
}
