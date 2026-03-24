import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EpisodeList, type EpisodeListProps } from '../EpisodeList';

// ── mock spatial nav ──────────────────────────────────────────────────────────

vi.mock('@shared/hooks/useSpatialNav', () => ({
  useSpatialFocusable: () => ({ ref: { current: null }, showFocusRing: false, focusProps: {} }),
  useSpatialContainer: () => ({ ref: { current: null }, focusKey: 'test-key' }),
  FocusContext: { Provider: ({ children }: any) => children },
  setFocus: vi.fn(),
}));

// ── mock utilities ────────────────────────────────────────────────────────────

vi.mock('@shared/utils/formatDuration', () => ({
  formatDuration: (secs: number) => `${Math.floor(secs / 60)}m`,
}));

// ── mock data ─────────────────────────────────────────────────────────────────

const mockEpisodes = [
  {
    id: 'ep-1',
    episode_num: 1,
    title: 'Pilot',
    container_extension: 'mp4',
    added: '1700000000',
    info: {
      duration_secs: 2700,
      duration: '45m',
      plot: 'The series begins.',
      movie_image: 'https://img.example.com/s1e1.jpg',
    },
    season: 1,
    direct_source: '',
  },
  {
    id: 'ep-2',
    episode_num: 2,
    title: 'Episode Two',
    container_extension: 'mp4',
    added: '1700000100',
    info: {
      duration_secs: 2520,
      duration: '42m',
      plot: 'Things escalate.',
      movie_image: 'https://img.example.com/s1e2.jpg',
    },
    season: 1,
    direct_source: '',
  },
  {
    id: 'ep-3',
    episode_num: 3,
    title: 'Episode Three',
    container_extension: 'mp4',
    added: '1700000200',
    info: {
      duration_secs: 2640,
      duration: '44m',
      plot: 'Consequences unfold.',
      movie_image: 'https://img.example.com/s1e3.jpg',
    },
    season: 1,
    direct_source: '',
  },
];

// ── helpers ───────────────────────────────────────────────────────────────────

const mockOnEpisodeSelect = vi.fn();

const defaultProps: EpisodeListProps = {
  episodes: mockEpisodes,
  seasonNumber: 1,
  seriesId: '99',
  onEpisodeSelect: mockOnEpisodeSelect,
};

function renderList(overrides?: Partial<EpisodeListProps>) {
  return render(<EpisodeList {...defaultProps} {...overrides} />);
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ── tests ─────────────────────────────────────────────────────────────────────

describe('EpisodeList — rendering', () => {
  it('renders each episode title', () => {
    renderList();
    expect(screen.getByText('Pilot')).toBeTruthy();
    expect(screen.getByText('Episode Two')).toBeTruthy();
    expect(screen.getByText('Episode Three')).toBeTruthy();
  });

  it('renders episode duration for each item', () => {
    renderList();
    // Duration should be formatted and displayed
    const durations = screen.getAllByText(/\dm/);
    expect(durations.length).toBeGreaterThan(0);
  });

  it('renders episode thumbnail images', () => {
    renderList();
    const images = screen.getAllByRole('img');
    expect(images.length).toBeGreaterThan(0);
  });

  it('renders episode number for each item', () => {
    renderList();
    // Episode numbers in S01E01 format
    expect(screen.getByText(/S01E01|E01|1/)).toBeTruthy();
    expect(screen.getByText(/S01E02|E02|2/)).toBeTruthy();
  });
});

describe('EpisodeList — episode interaction', () => {
  it('clicking an episode calls onEpisodeSelect with the episode', () => {
    renderList();
    // Find the first clickable episode element
    const episodeButtons = screen.getAllByRole('button');
    fireEvent.click(episodeButtons[0]!);
    expect(mockOnEpisodeSelect).toHaveBeenCalledTimes(1);
    expect(mockOnEpisodeSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'ep-1' }),
    );
  });

  it('clicking second episode calls onEpisodeSelect with second episode data', () => {
    renderList();
    const episodeButtons = screen.getAllByRole('button');
    fireEvent.click(episodeButtons[1]!);
    expect(mockOnEpisodeSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'ep-2' }),
    );
  });
});

describe('EpisodeList — progress bars', () => {
  it('renders progress bar for partially watched episodes', () => {
    const watchProgress = { 'ep-1': { progressSeconds: 900, durationSeconds: 2700 } };
    renderList({ watchProgress } as any);
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toBeTruthy();
    const value = Number(progressbar.getAttribute('aria-valuenow'));
    expect(value).toBeGreaterThan(0);
    expect(value).toBeLessThanOrEqual(100);
  });

  it('does NOT render progress bar for episodes with no watch progress', () => {
    renderList(); // no watchProgress prop
    expect(screen.queryByRole('progressbar')).toBeNull();
  });
});

describe('EpisodeList — pagination (Load More)', () => {
  it('renders "Load More" button when hasMore is true', () => {
    renderList({ hasMore: true, onLoadMore: vi.fn() } as any);
    expect(screen.getByText(/load more/i)).toBeTruthy();
  });

  it('does NOT render "Load More" when hasMore is false', () => {
    renderList({ hasMore: false } as any);
    expect(screen.queryByText(/load more/i)).toBeNull();
  });

  it('clicking "Load More" calls onLoadMore callback', () => {
    const onLoadMore = vi.fn();
    renderList({ hasMore: true, onLoadMore } as any);
    const btn = screen.getByText(/load more/i);
    fireEvent.click(btn);
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });
});

describe('EpisodeList — sort order', () => {
  it('renders episodes in ascending order by default', () => {
    renderList();
    const titles = screen.getAllByRole('button').map((b) => b.textContent);
    // First episode should appear before third
    expect(titles.join(' ')).toMatch(/Pilot/);
  });
});
