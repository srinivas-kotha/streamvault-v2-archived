import { useMemo, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  useSpatialContainer,
  FocusContext,
  setFocus,
} from "@shared/hooks/useSpatialNav";
import { useSeriesByLanguage, type SeriesWithChannel } from "../api";
import { ContentRail } from "@shared/components/ContentRail";
import { PosterCard } from "@/design-system";
import { PageTransition } from "@shared/components/PageTransition";
import { isNewContent } from "@shared/utils/isNewContent";

export function SeriesPage() {
  const navigate = useNavigate();
  const { ref: containerRef, focusKey } = useSpatialContainer({
    focusKey: "SERIES_PAGE",
    focusable: false,
  });

  const { allSeries, channels, isLoading } = useSeriesByLanguage("Telugu");

  // Auto-focus first channel rail after data loads
  useEffect(() => {
    if (isLoading || !channels.length) return;
    const firstChannelId = channels[0]?.id;
    if (!firstChannelId) return;
    const timer = setTimeout(() => {
      try {
        setFocus(`series-channel-${firstChannelId}`);
      } catch {
        /* not mounted */
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [isLoading, channels]);

  // Group series by channel, preserving channel order from the API
  const seriesByChannel = useMemo(() => {
    const grouped = new Map<
      string,
      { name: string; items: SeriesWithChannel[] }
    >();

    for (const ch of channels) {
      grouped.set(ch.id, { name: ch.name, items: [] });
    }

    for (const item of allSeries) {
      const group = grouped.get(item.channelId);
      if (group) {
        group.items.push(item);
      }
    }

    // Filter out empty channels
    return Array.from(grouped.entries())
      .filter(([, group]) => group.items.length > 0)
      .map(([id, group]) => ({ id, ...group }));
  }, [allSeries, channels]);

  return (
    <PageTransition>
      <FocusContext.Provider value={focusKey}>
        <div ref={containerRef} className="pt-4 pb-12 space-y-4">
          <h1 className="font-display text-2xl font-bold text-text-primary">
            Series
          </h1>

          {isLoading ? (
            <>
              {Array.from({ length: 4 }).map((_, i) => (
                <ContentRail key={i} title="" isLoading>
                  {null}
                </ContentRail>
              ))}
            </>
          ) : (
            seriesByChannel.map((channel) => (
              <ContentRail
                key={channel.id}
                title={channel.name}
                focusKey={`series-channel-${channel.id}`}
              >
                {channel.items.map((item) => (
                  <div key={item.id} className="rail-item flex-shrink-0">
                    <PosterCard
                      focusKey={`series-${item.id}`}
                      imageUrl={item.icon || ""}
                      title={item.name}
                      isNew={isNewContent(item.added ?? undefined)}
                      onClick={() =>
                        navigate({
                          to: "/series/$seriesId",
                          params: { seriesId: item.id },
                        })
                      }
                    />
                  </div>
                ))}
              </ContentRail>
            ))
          )}
        </div>
      </FocusContext.Provider>
    </PageTransition>
  );
}
