import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePlayerStore } from '@lib/store';
import { MovieDetail } from '../MovieDetail';

// ── mock useFocusStyles (avoids window.matchMedia in jsdom) ──────────────────

vi.mock('@/design-system/focus/useFocusStyles', () => ({
  useFocusStyles: () => ({
    cardFocus: 'ring-2 ring-accent-teal shadow-focus',
    buttonFocus: 'ring-2 ring-accent-teal ring-offset-2 ring-offset-bg-primary',
    inputFocus: 'ring-2 ring-accent-teal',
  }),
}));

// ── mock spatial nav ──────────────────────────────────────────────────────────

vi.mock('@shared/hooks/useSpatialNav', () => ({
  useSpatialFocusable: () => ({ ref: { current: null }, showFocusRing: false, focusProps: {} }),
  useSpatialContainer: () => ({ ref: { current: null }, focusKey: 'test-key' }),
  FocusContext: { Provider: ({ children }: any) => children },
  setFocus: vi.fn(),
  doesFocusableExist: vi.fn(() => false),
}));

// ── mock PageTransition ───────────────────────────────────────────────────────

vi.mock('@shared/components/PageTransition', () => ({
  PageTransition: ({ children }: any) => <div>{children}</div>,
}));

// ── mock shared components ────────────────────────────────────────────────────

vi.mock('@shared/components/Button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}));

vi.mock('@shared/components/Badge', () => ({
  Badge: ({ children, variant }: any) => (
    <span data-testid="badge" data-variant={variant}>{children}</span>
  ),
}));

vi.mock('@shared/components/StarRating', () => ({
  StarRating: ({ rating }: any) => <div data-testid="star-rating" aria-label={`Rating: ${rating}`}>{rating}</div>,
}));

vi.mock('@shared/components/Skeleton', () => ({
  Skeleton: ({ className }: any) => <div data-testid="skeleton" className={className + ' animate-pulse'} />,
}));

// ── mock PlayerPage (AC-01: no inline player rendered by default) ──────────────

vi.mock('@features/player/components/PlayerPage', () => ({
  PlayerPage: (props: any) => (
    <div data-testid="player-page" data-stream-type={props.streamType} data-stream-id={props.streamId} />
  ),
}));

// ── mock utilities ────────────────────────────────────────────────────────────

vi.mock('@shared/utils/formatDuration', () => ({
  formatDuration: (secs: number) => `${Math.floor(secs / 60)}m`,
}));

vi.mock('@shared/utils/parseGenres', () => ({
  parseGenres: (s: string) => s ? s.split(',').map((g: string) => g.trim()) : [],
}));

// ── mock router ───────────────────────────────────────────────────────────────

const mockBack = vi.fn();
vi.mock('@tanstack/react-router', () => ({
  useParams: () => ({ vodId: '42' }),
  useRouter: () => ({ history: { back: mockBack } }),
  useNavigate: () => vi.fn(),
}));

// ── mock API hooks ─────────────────────────────────────────────────────────────

const mockUseVODInfo = vi.fn();
const mockUseWatchHistory = vi.fn();

vi.mock('@features/vod/api', () => ({
  useVODInfo: (id: string) => mockUseVODInfo(id),
}));

vi.mock('@features/history/api', () => ({
  useWatchHistory: () => mockUseWatchHistory(),
}));

vi.mock('@features/favorites/api', () => ({
  useIsFavorite: () => false,
  useAddFavorite: () => ({ mutate: vi.fn() }),
  useRemoveFavorite: () => ({ mutate: vi.fn() }),
}));

// ── mock data ─────────────────────────────────────────────────────────────────

const mockVODInfo = {
  info: {
    movie_image: 'https://img.example.com/inception.jpg',
    tmdb_id: '27205',
    name: 'Inception',
    o_name: 'Inception',
    plot: 'A thief who steals corporate secrets through dream-sharing technology.',
    cast: 'Leonardo DiCaprio, Joseph Gordon-Levitt',
    director: 'Christopher Nolan',
    genre: 'Action, Sci-Fi, Thriller',
    releaseDate: '2010-07-16',
    duration: '2h 28m',
    duration_secs: 8928,
    rating: '8.8',
  },
  movie_data: {
    stream_id: 42,
    name: 'Inception',
    added: '1700000000',
    category_id: '1',
    container_extension: 'mkv',
    custom_sid: '',
    direct_source: '',
  },
};

// ── helpers ───────────────────────────────────────────────────────────────────

function createQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderMovieDetail() {
  const client = createQueryClient();
  return render(
    <QueryClientProvider client={client}>
      <MovieDetail />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUseVODInfo.mockReturnValue({ data: mockVODInfo, isLoading: false, isError: false });
  mockUseWatchHistory.mockReturnValue({ data: [] });

  // Reset player store
  usePlayerStore.setState({
    currentStreamId: null,
    currentStreamType: null,
    currentStreamName: null,
    startTime: 0,
    volume: 1,
    isMuted: false,
    seriesId: null,
    seasonNumber: null,
    episodeIndex: null,
    episodeList: [],
  });
});

// ── tests ─────────────────────────────────────────────────────────────────────

describe('MovieDetail — metadata rendering', () => {
  it('renders movie title', () => {
    renderMovieDetail();
    expect(screen.getAllByText('Inception').length).toBeGreaterThan(0);
  });

  it('renders release year from releaseDate', () => {
    renderMovieDetail();
    expect(screen.getByText('2010')).toBeTruthy();
  });

  it('renders rating via StarRating component', () => {
    renderMovieDetail();
    expect(screen.getByTestId('star-rating')).toBeTruthy();
  });

  it('renders genre badges', () => {
    renderMovieDetail();
    const badges = screen.getAllByTestId('badge');
    const genreTexts = badges.map((b) => b.textContent);
    expect(genreTexts).toContain('Action');
  });

  it('renders plot/description text', () => {
    renderMovieDetail();
    expect(screen.getByText(/thief who steals corporate secrets/)).toBeTruthy();
  });

  it('renders cast information', () => {
    renderMovieDetail();
    expect(screen.getByText(/Leonardo DiCaprio/)).toBeTruthy();
  });
});

describe('MovieDetail — play button', () => {
  it('renders a Play button', () => {
    renderMovieDetail();
    const playBtn = screen.getByRole('button', { name: /play/i });
    expect(playBtn).toBeTruthy();
  });

  it('shows "Resume" label when watch history has progress', () => {
    mockUseWatchHistory.mockReturnValue({
      data: [{ content_type: 'vod', content_id: 42, progress_seconds: 1200, duration_seconds: 8928 }],
    });
    renderMovieDetail();
    expect(screen.getByText(/resume/i)).toBeTruthy();
  });

  it('shows "Play" label when no watch history', () => {
    renderMovieDetail();
    expect(screen.getByText('Play')).toBeTruthy();
  });

  it('shows "Start Over" button when watch history has progress', () => {
    mockUseWatchHistory.mockReturnValue({
      data: [{ content_type: 'vod', content_id: 42, progress_seconds: 1200, duration_seconds: 8928 }],
    });
    renderMovieDetail();
    expect(screen.getByText('Start Over')).toBeTruthy();
  });
});

describe('MovieDetail — loading and error states', () => {
  it('renders skeleton while useVODInfo is loading', () => {
    mockUseVODInfo.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    renderMovieDetail();
    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders unavailable state when data is null after loading completes', () => {
    // v1 component checks: if (!data || !data.info || Array.isArray(data.info) || !data.info.name)
    mockUseVODInfo.mockReturnValue({ data: null, isLoading: false, isError: false });
    renderMovieDetail();
    expect(screen.getAllByText(/unavailable|not found|go back/i).length).toBeGreaterThan(0);
  });
});

describe('MovieDetail — AC-01 compliance (no auto-playing inline player)', () => {
  it('does NOT render PlayerPage on initial load (player closed by default)', () => {
    renderMovieDetail();
    // PlayerPage should NOT be present until user clicks Play
    expect(screen.queryByTestId('player-page')).toBeNull();
  });

  it('calls playerStore.playStream when Play button is clicked (AC-01: global player, no inline)', () => {
    renderMovieDetail();
    // PlayerPage is never rendered inline — AC-01 requires global FullscreenPlayer
    expect(screen.queryByTestId('player-page')).toBeNull();

    const playBtn = screen.getByRole('button', { name: /play/i });
    fireEvent.click(playBtn);

    // PlayerPage is still not rendered inline — playback goes through global store
    expect(screen.queryByTestId('player-page')).toBeNull();
    // playerStore should now have a stream loaded
    const { currentStreamId, currentStreamType } = usePlayerStore.getState();
    expect(currentStreamId).toBe('42');
    expect(currentStreamType).toBe('vod');
  });
});
