/**
 * DetailLayout — SRI-19 page template
 *
 * Structure:
 *   - Full-bleed hero backdrop (parallax-ready)
 *   - Metadata panel: title, rating, genres, description, CTA
 *   - Related content rails below
 *
 * Usage:
 *   <DetailLayout
 *     backdropUrl="/poster.jpg"
 *     title="Movie Title"
 *     metadata={<MetadataPanel />}
 *   >
 *     <ContentRail title="More Like This" ... />
 *   </DetailLayout>
 */

import type { ReactNode } from "react";

interface DetailLayoutProps {
  /** Full-bleed background image URL */
  backdropUrl: string;
  /** Content title (used as img alt) */
  title: string;
  /** Metadata panel: rating, genres, description, play button */
  metadata: ReactNode;
  /** Related content rails rendered below the hero */
  children?: ReactNode;
}

export function DetailLayout({
  backdropUrl,
  title,
  metadata,
  children,
}: DetailLayoutProps) {
  return (
    <div className="min-h-screen" data-testid="detail-layout">
      {/* Full-bleed hero */}
      <section
        aria-label={`${title} details`}
        className="relative w-full"
        style={{ minHeight: "min(60vh, 520px)" }}
      >
        {/* Backdrop */}
        <img
          src={backdropUrl}
          alt=""
          aria-hidden
          draggable={false}
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
          fetchPriority="high"
        />

        {/* Multi-layer gradient: bottom-heavy for text, subtle top for nav readability */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(to top, #0a0a0f 0%, rgba(10,10,15,0.7) 40%, rgba(10,10,15,0.2) 80%, transparent 100%)",
          }}
        />
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(to right, rgba(10,10,15,0.6) 0%, transparent 60%)",
          }}
        />

        {/* Metadata overlay — bottom-left, TV safe zone */}
        <div className="absolute bottom-0 left-0 right-0 px-6 lg:px-12 pb-8 pt-24">
          {metadata}
        </div>
      </section>

      {/* Related content rails */}
      {children && (
        <div className="flex flex-col gap-8 py-8 px-6 lg:px-12">{children}</div>
      )}
    </div>
  );
}
