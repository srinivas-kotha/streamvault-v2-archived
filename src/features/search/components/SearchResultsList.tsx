import { PosterCard, ChannelCard } from "@/design-system";
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
                <ChannelCard
                  key={`live-${stream.id}`}
                  channelName={stream.name}
                  logoUrl={stream.icon || ""}
                  isLive={true}
                  focusKey={`search-live-${stream.id}`}
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
                <PosterCard
                  key={`vod-${movie.id}`}
                  title={movie.name}
                  imageUrl={movie.icon || ""}
                  rating={movie.rating ? String(movie.rating) : undefined}
                  focusKey={`search-vod-${movie.id}`}
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
                <PosterCard
                  key={`series-${show.id}`}
                  title={show.name}
                  imageUrl={show.icon || ""}
                  focusKey={`search-series-${show.id}`}
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
