import { useMemo } from 'react';
import { useParams, useNavigate, useSearch } from '@tanstack/react-router';
import { PageTransition } from '@shared/components/PageTransition';
import { HeroBanner, type HeroItem } from '@shared/components/HeroBanner';
import { useLanguageMovieRails } from './api';
import { useSeriesByLanguage } from '@features/series/api';
import { MoviesTabContent } from './components/MoviesTabContent';
import { SeriesTabContent } from './components/SeriesTabContent';
import { LiveTabContent } from './components/LiveTabContent';

type TabKey = 'movies' | 'series' | 'live';

const tabs: { key: TabKey; label: string }[] = [
  { key: 'movies', label: 'Movies' },
  { key: 'series', label: 'Series' },
  { key: 'live', label: 'Live TV' },
];

export function LanguageHubPage() {
  const { lang } = useParams({ strict: false }) as { lang?: string };
  const language = lang ? lang.charAt(0).toUpperCase() + lang.slice(1) : '';
  const navigate = useNavigate();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { tab } = useSearch({ from: '/_authenticated/language/$lang' as any });
  const activeTab: TabKey = (tab as TabKey) || 'movies';
  const setActiveTab = (newTab: TabKey) => {
    navigate({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      search: { tab: newTab === 'movies' ? undefined : newTab } as any,
    });
  };

  // Data for hero banner only
  const { rails: movieRails } = useLanguageMovieRails(language);
  const { allSeries } = useSeriesByLanguage(language);

  // Hero items from top movies or series
  const heroItems = useMemo<HeroItem[]>(() => {
    if (activeTab === 'movies' && movieRails.length > 0) {
      return (movieRails[0]?.items ?? []).slice(0, 5).map((m) => ({
        id: m.stream_id,
        type: 'vod' as const,
        title: m.name,
        image: m.stream_icon,
        rating: m.rating || undefined,
      }));
    }
    if (activeTab === 'series' && allSeries.length > 0) {
      return allSeries.slice(0, 5).map((s) => ({
        id: s.series_id,
        type: 'series' as const,
        title: s.name,
        description: s.plot || undefined,
        image: s.backdrop_path?.[0] || s.cover,
        rating: s.rating || undefined,
        genre: s.genre || undefined,
      }));
    }
    return [];
  }, [activeTab, movieRails, allSeries]);

  if (!lang) {
    return (
      <PageTransition>
        <div className="px-6 lg:px-10 py-20 text-center">
          <p className="text-text-muted text-lg">Language not found</p>
        </div>
      </PageTransition>
    );
  }

  // Keyboard tab switching
  const handleTabKeyDown = (e: React.KeyboardEvent) => {
    const currentIdx = tabs.findIndex((t) => t.key === activeTab);
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const next = tabs[(currentIdx + 1) % tabs.length];
      if (next) setActiveTab(next.key);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prev = tabs[(currentIdx - 1 + tabs.length) % tabs.length];
      if (prev) setActiveTab(prev.key);
    }
  };

  return (
    <PageTransition>
      <div className="space-y-6 pb-12">
        {/* Hero Banner */}
        {heroItems.length > 0 && <HeroBanner items={heroItems} />}

        {/* Content Tabs */}
        <div className="px-6 lg:px-10 relative z-10">
          <div
            className="flex items-center gap-1 border-b border-border-subtle"
            onKeyDown={handleTabKeyDown}
            role="tablist"
          >
            {tabs.map((t) => (
              <button
                key={t.key}
                role="tab"
                aria-selected={activeTab === t.key}
                onClick={() => setActiveTab(t.key)}
                className={`relative px-5 py-3 text-sm font-medium transition-all min-h-[48px] ${
                  activeTab === t.key
                    ? 'text-text-primary'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                {t.label}
                {activeTab === t.key && (
                  <span className="absolute bottom-0 left-1 right-1 h-0.5 bg-gradient-to-r from-teal to-indigo rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'movies' && <MoviesTabContent language={language} lang={lang} />}
        {activeTab === 'series' && <SeriesTabContent language={language} />}
        {activeTab === 'live' && <LiveTabContent language={language} lang={lang} />}
      </div>
    </PageTransition>
  );
}
