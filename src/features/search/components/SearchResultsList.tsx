import { ContentCard } from "@shared/components/ContentCard";
import { useSpatialContainer, FocusContext } from "@shared/hooks/useSpatialNav";
import type {
  XtreamLiveStream,
  XtreamVODStream,
  XtreamSeriesItem,
} from "@shared/types/api";

type TabType = "all" | "live" | "vod" | "series";

const CARD_GRID =
  "grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3";

function SearchResultsContainer({ children }: { children: React.ReactNode }) {
  const { ref, focusKey } = useSpatialContainer({ focusKey: "search-results" });
  return (
    <FocusContext.Provider value={focusKey}>
      <div ref={ref}>{children}</div>
    </FocusContext.Provider>
  );
}

export function SearchResultsList({
  filteredData,
  activeTab,
  onLiveClick,
  onVodClick,
  onSeriesClick,
}: {
  filteredData: {
    live: XtreamLiveStream[];
    vod: XtreamVODStream[];
    series: XtreamSeriesItem[];
  };
  activeTab: TabType;
  onLiveClick: (stream: XtreamLiveStream) => void;
  onVodClick: (vodId: string) => void;
  onSeriesClick: (seriesId: string) => void;
}) {
  const showLive = activeTab === "all" || activeTab === "live";
  const showVod = activeTab === "all" || activeTab === "vod";
  const showSeries = activeTab === "all" || activeTab === "series";

  return (
    <SearchResultsContainer>
      <div className="space-y-8">
        {showLive && filteredData.live.length > 0 && (
          <section>
            {activeTab === "all" && (
              <h2 className="font-display text-lg font-bold text-text-primary mb-3">
                Live TV{" "}
                <span className="ml-2 text-sm font-normal text-text-secondary">
                  ({filteredData.live.length})
                </span>
              </h2>
            )}
            <div className={CARD_GRID}>
              {filteredData.live.map((stream) => (
                <ContentCard
                  key={`live-${stream.id}`}
                  image={stream.icon || ""}
                  title={stream.name}
                  aspectRatio="square"
                  badge={
                    <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase bg-red-500/90 text-white rounded">
                      Live
                    </span>
                  }
                  onClick={() => onLiveClick(stream)}
                />
              ))}
            </div>
          </section>
        )}
        {showVod && filteredData.vod.length > 0 && (
          <section>
            {activeTab === "all" && (
              <h2 className="font-display text-lg font-bold text-text-primary mb-3">
                Movies{" "}
                <span className="ml-2 text-sm font-normal text-text-secondary">
                  ({filteredData.vod.length})
                </span>
              </h2>
            )}
            <div className={CARD_GRID}>
              {filteredData.vod.map((movie) => (
                <ContentCard
                  key={`vod-${movie.id}`}
                  image={movie.icon || ""}
                  title={movie.name}
                  subtitle={movie.rating ? `${movie.rating}/10` : undefined}
                  aspectRatio="poster"
                  onClick={() => onVodClick(movie.id)}
                />
              ))}
            </div>
          </section>
        )}
        {showSeries && filteredData.series.length > 0 && (
          <section>
            {activeTab === "all" && (
              <h2 className="font-display text-lg font-bold text-text-primary mb-3">
                Series{" "}
                <span className="ml-2 text-sm font-normal text-text-secondary">
                  ({filteredData.series.length})
                </span>
              </h2>
            )}
            <div className={CARD_GRID}>
              {filteredData.series.map((show) => (
                <ContentCard
                  key={`series-${show.id}`}
                  image={show.icon || ""}
                  title={show.name}
                  subtitle={show.genre || undefined}
                  aspectRatio="poster"
                  onClick={() => onSeriesClick(show.id)}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </SearchResultsContainer>
  );
}
