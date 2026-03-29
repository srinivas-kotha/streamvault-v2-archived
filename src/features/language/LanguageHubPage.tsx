import { useParams, useNavigate, useSearch } from "@tanstack/react-router";
import {
  useSpatialFocusable,
  useSpatialContainer,
} from "@shared/hooks/useSpatialNav";
import { usePageFocus } from "@shared/hooks/usePageFocus";
import { PageTransition } from "@shared/components/PageTransition";
import { MoviesTabContent } from "./components/MoviesTabContent";
import { SeriesTabContent } from "./components/SeriesTabContent";
import { LiveTabContent } from "./components/LiveTabContent";
type TabKey = "movies" | "series" | "live";

const tabs: { key: TabKey; label: string }[] = [
  { key: "movies", label: "Movies" },
  { key: "series", label: "Series" },
  { key: "live", label: "Live TV" },
];

function FocusableTab({
  id,
  label,
  isActive,
  onSelect,
}: {
  id: string;
  label: string;
  isActive: boolean;
  onSelect: () => void;
}) {
  const { ref, showFocusRing, focusProps } = useSpatialFocusable({
    focusKey: id,
    onEnterPress: onSelect,
  });

  return (
    <button
      ref={ref}
      {...focusProps}
      role="tab"
      aria-selected={isActive}
      onClick={onSelect}
      className={`relative px-5 py-3 text-sm font-medium transition-[background-color,border-color,color] min-h-[48px] ${
        isActive
          ? "text-text-primary"
          : showFocusRing
            ? "text-text-primary bg-surface-raised/50 ring-2 ring-teal/50 rounded-t-lg"
            : "text-text-muted hover:text-text-secondary"
      }`}
    >
      {label}
      {isActive && (
        <span className="absolute bottom-0 left-1 right-1 h-0.5 bg-gradient-to-r from-teal to-indigo rounded-full" />
      )}
    </button>
  );
}

export function LanguageHubPage() {
  const { lang } = useParams({ strict: false }) as { lang?: string };
  const language = lang ? lang.charAt(0).toUpperCase() + lang.slice(1) : "";
  const navigate = useNavigate();
  usePageFocus("langhub-tab-movies");
  const { ref: containerRef } = useSpatialContainer({
    focusKey: "LANGUAGE_HUB_PAGE",
    focusable: false,
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { tab } = useSearch({ from: "/_authenticated/language/$lang" as any });
  const activeTab: TabKey = (tab as TabKey) || "movies";
  const setActiveTab = (newTab: TabKey) => {
    navigate({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      search: { tab: newTab === "movies" ? undefined : newTab } as any,
    });
  };

  if (!lang) {
    return (
      <PageTransition>
        <div className="py-20 text-center">
          <p className="text-text-muted text-lg">Language not found</p>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div ref={containerRef} className="space-y-4 pb-12">
        {/* Content Tabs — language switching is via TopNav */}
        <div className="relative z-10">
          <div
            className="flex items-center gap-1 border-b border-border-subtle"
            role="tablist"
          >
            {tabs.map((t) => (
              <FocusableTab
                id={`langhub-tab-${t.key}`}
                key={t.key}
                label={t.label}
                isActive={activeTab === t.key}
                onSelect={() => setActiveTab(t.key)}
              />
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "movies" && (
          <MoviesTabContent language={language} lang={lang} />
        )}
        {activeTab === "series" && <SeriesTabContent language={language} />}
        {activeTab === "live" && (
          <LiveTabContent language={language} lang={lang} />
        )}
      </div>
    </PageTransition>
  );
}
