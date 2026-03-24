import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { VODPage } from '../VODPage';

// ── mock spatial nav (no DOM layout available in jsdom) ───────────────────────

vi.mock('@shared/hooks/useSpatialNav', () => ({
  useSpatialFocusable: () => ({ ref: { current: null }, showFocusRing: false, focusProps: {} }),
  useSpatialContainer: () => ({ ref: { current: null }, focusKey: 'test-key' }),
  FocusContext: { Provider: ({ children }: any) => children },
  setFocus: vi.fn(),
}));

// ── mock PageTransition (no animation in tests) ───────────────────────────────

vi.mock('@shared/components/PageTransition', () => ({
  PageTransition: ({ children }: any) => <div>{children}</div>,
}));

// ── mock shared components ────────────────────────────────────────────────────

vi.mock('@shared/components/CategoryGrid', () => ({
  CategoryGrid: ({ categories, onSelect }: any) => (
    <div data-testid="category-grid">
      {categories.map((cat: any) => (
        <button
          key={cat.category_id}
          data-testid={`category-${cat.category_id}`}
          onClick={() => onSelect(cat.category_id)}
        >
          {cat.category_name}
        </button>
      ))}
    </div>
  ),
}));

vi.mock('@shared/components/Skeleton', () => ({
  SkeletonGrid: ({ count }: any) => (
    <div data-testid="skeleton-grid">
      {Array.from({ length: count }).map((_: any, i: number) => (
        <div key={i} className="animate-pulse" data-testid="card-skeleton" />
      ))}
    </div>
  ),
}));

vi.mock('@shared/components/EmptyState', () => ({
  EmptyState: ({ title }: any) => <div data-testid="empty-state">{title}</div>,
}));

vi.mock('@shared/components/Badge', () => ({
  Badge: ({ children }: any) => <span data-testid="badge">{children}</span>,
}));

vi.mock('@shared/components/ContentCard', () => ({
  ContentCard: ({ title, onClick }: any) => (
    <div data-testid="content-card" onClick={onClick} role="button" aria-label={title}>
      {title}
    </div>
  ),
}));

vi.mock('@features/vod/components/SortFilterBar', () => ({
  SortFilterBar: ({ sort, onSortChange }: any) => (
    <div data-testid="sort-filter-bar">
      <button
        data-testid="sort-alphabetical"
        onClick={() => onSortChange({ field: 'name', direction: 'asc', label: 'A-Z' })}
      >
        A-Z
      </button>
      <button
        data-testid="sort-rating"
        onClick={() => onSortChange({ field: 'rating_5based', direction: 'desc', label: 'Rating' })}
      >
        Rating
      </button>
    </div>
  ),
}));

// ── mock utilities ────────────────────────────────────────────────────────────

vi.mock('@shared/utils/sortContent', () => ({
  SORT_OPTIONS: [
    { field: 'name', direction: 'asc', label: 'A-Z' },
    { field: 'rating_5based', direction: 'desc', label: 'Rating' },
    { field: 'added', direction: 'desc', label: 'Date Added' },
  ],
  sortContent: (items: any[]) => items,
}));

vi.mock('@shared/utils/filterContent', () => ({
  DEFAULT_FILTERS: { genre: '', year: '', rating: '' },
  filterContent: (items: any[]) => items,
}));

vi.mock('@shared/utils/parseGenres', () => ({
  collectAllGenres: () => [],
  parseGenres: (s: string) => s ? s.split(',').map((g: string) => g.trim()) : [],
}));

vi.mock('@shared/hooks/useDebounce', () => ({
  useDebounce: (v: any) => v,
}));

// ── mock router ───────────────────────────────────────────────────────────────

const mockNavigate = vi.fn();
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
  useParams: () => ({}),
}));

// ── mock API hooks ─────────────────────────────────────────────────────────────

const mockUseVODCategories = vi.fn();
const mockUseVODStreams = vi.fn();

vi.mock('@features/vod/api', () => ({
  useVODCategories: () => mockUseVODCategories(),
  useVODStreams: (catId: string) => mockUseVODStreams(catId),
}));

// ── mock data ─────────────────────────────────────────────────────────────────

const mockCategories = [
  { category_id: '1', category_name: 'Action', parent_id: 0 },
  { category_id: '2', category_name: 'Drama', parent_id: 0 },
  { category_id: '3', category_name: 'Comedy', parent_id: 0 },
];

const mockStreams = [
  { stream_id: 101, name: 'Inception', stream_icon: 'https://img.example.com/inception.jpg', rating: '8.8', rating_5based: 4.4, container_extension: 'mkv', added: '1700000000', is_adult: '0', category_id: '1', category_ids: [1], num: 1, stream_type: 'movie', custom_sid: '', direct_source: '' },
  { stream_id: 102, name: 'The Dark Knight', stream_icon: 'https://img.example.com/tdk.jpg', rating: '9.0', rating_5based: 4.5, container_extension: 'mp4', added: '1700000001', is_adult: '0', category_id: '1', category_ids: [1], num: 2, stream_type: 'movie', custom_sid: '', direct_source: '' },
  { stream_id: 103, name: 'Interstellar', stream_icon: 'https://img.example.com/int.jpg', rating: '8.6', rating_5based: 4.3, container_extension: 'mkv', added: '1700000002', is_adult: '0', category_id: '1', category_ids: [1], num: 3, stream_type: 'movie', custom_sid: '', direct_source: '' },
];

// ── helpers ───────────────────────────────────────────────────────────────────

function createQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderVODPage() {
  const client = createQueryClient();
  return render(
    <QueryClientProvider client={client}>
      <VODPage />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUseVODCategories.mockReturnValue({ data: mockCategories, isLoading: false });
  mockUseVODStreams.mockReturnValue({ data: mockStreams, isLoading: false });
});

// ── tests ─────────────────────────────────────────────────────────────────────

describe('VODPage — page heading', () => {
  it('renders a "Movies" page heading', () => {
    renderVODPage();
    expect(screen.getByText('Movies')).toBeTruthy();
  });
});

describe('VODPage — category list', () => {
  it('renders category list from useVODCategories', () => {
    renderVODPage();
    expect(screen.getByText('Action')).toBeTruthy();
    expect(screen.getByText('Drama')).toBeTruthy();
    expect(screen.getByText('Comedy')).toBeTruthy();
  });

  it('renders category loading skeleton while categories are loading', () => {
    mockUseVODCategories.mockReturnValue({ data: undefined, isLoading: true });
    const { container } = renderVODPage();
    const skeleton = container.querySelector('.animate-pulse');
    expect(skeleton).not.toBeNull();
  });

  it('selecting a category triggers useVODStreams with that categoryId', () => {
    renderVODPage();
    const dramaBtn = screen.getByTestId('category-2');
    fireEvent.click(dramaBtn);
    // After selecting category 2, streams hook should be called with '2'
    expect(mockUseVODStreams).toHaveBeenCalledWith('2');
  });
});

describe('VODPage — streams grid', () => {
  it('renders a content card for each stream', () => {
    renderVODPage();
    const cards = screen.getAllByTestId('content-card');
    expect(cards.length).toBe(mockStreams.length);
  });

  it('renders loading skeleton while streams are loading', () => {
    mockUseVODStreams.mockReturnValue({ data: undefined, isLoading: true });
    const { container } = renderVODPage();
    const skeletonGrid = screen.getByTestId('skeleton-grid');
    expect(skeletonGrid).toBeTruthy();
  });

  it('shows empty state when no streams in category', () => {
    mockUseVODStreams.mockReturnValue({ data: [], isLoading: false });
    renderVODPage();
    expect(screen.getByTestId('empty-state')).toBeTruthy();
    expect(screen.getByText('No movies found')).toBeTruthy();
  });

  it('clicking a movie card navigates to /vod/$vodId', () => {
    renderVODPage();
    const firstCard = screen.getAllByTestId('content-card')[0]!;
    fireEvent.click(firstCard);
    expect(mockNavigate).toHaveBeenCalledWith({
      to: '/vod/$vodId',
      params: { vodId: String(mockStreams[0]!.stream_id) },
    });
  });
});

describe('VODPage — sort options', () => {
  it('renders sort/filter bar', () => {
    renderVODPage();
    expect(screen.getByTestId('sort-filter-bar')).toBeTruthy();
  });
});
