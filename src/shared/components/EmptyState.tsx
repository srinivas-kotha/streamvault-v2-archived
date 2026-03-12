interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: 'search' | 'content' | 'favorites' | 'history';
}

const icons = {
  search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  content: 'M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z',
  favorites: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
  history: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
};

export function EmptyState({ title = 'Nothing here', message = 'No content to display', icon = 'content' }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <svg className="w-16 h-16 text-text-muted/30 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d={icons[icon]} />
      </svg>
      <h3 className="text-lg font-medium text-text-secondary mb-1">{title}</h3>
      <p className="text-sm text-text-muted">{message}</p>
    </div>
  );
}
