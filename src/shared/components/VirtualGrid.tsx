import { type ReactNode, useRef, useState, useEffect, useCallback } from 'react';
import { useVirtualizer, type Virtualizer } from '@tanstack/react-virtual';

interface VirtualGridProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  estimateSize?: number;
  overscan?: number;
  columns?: number;
}

function getResponsiveColumns(width: number): number {
  if (width < 640) return 2;
  if (width < 768) return 3;
  if (width < 1024) return 4;
  if (width < 1280) return 5;
  return 6;
}

export function VirtualGrid<T>({
  items,
  renderItem,
  estimateSize = 280,
  overscan = 5,
  columns: columnsProp,
}: VirtualGridProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [measuredColumns, setMeasuredColumns] = useState(4);

  const columns = columnsProp ?? measuredColumns;

  const updateColumns = useCallback(() => {
    if (containerRef.current) {
      setMeasuredColumns(getResponsiveColumns(containerRef.current.offsetWidth));
    }
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || columnsProp !== undefined) return;

    // Initial measurement
    updateColumns();

    const observer = new ResizeObserver(() => {
      updateColumns();
    });
    observer.observe(el);

    return () => observer.disconnect();
  }, [columnsProp, updateColumns]);

  const rowCount = Math.ceil(items.length / columns);

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => containerRef.current,
    estimateSize: () => estimateSize,
    overscan,
  });

  return (
    <div
      ref={containerRef}
      className="h-[calc(100vh-12rem)] overflow-y-auto"
    >
      <div
        className="relative w-full"
        style={{ height: `${virtualizer.getTotalSize()}px` }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const rowStart = virtualRow.index * columns;

          return (
            <div
              key={virtualRow.key}
              className="absolute left-0 w-full grid gap-4"
              style={{
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
              }}
            >
              {Array.from({ length: columns }).map((_, colIndex) => {
                const itemIndex = rowStart + colIndex;
                const item = items[itemIndex];
                if (itemIndex >= items.length || !item) return null;

                return (
                  <div key={itemIndex}>
                    {renderItem(item, itemIndex)}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export type { VirtualGridProps };
export type VirtualGridVirtualizer = Virtualizer<HTMLDivElement, Element>;
