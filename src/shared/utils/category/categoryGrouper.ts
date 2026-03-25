import type { XtreamCategory } from "@shared/types/api";
import type { LanguageGroup, SubCategory } from "./types";
import { LANGUAGE_PRIORITY } from "./channelMappings";
import {
  extractYear,
  extractQuality,
  isCamRelease,
  buildDisplayName,
  stripLanguagePrefix,
} from "./helpers";
import {
  detectLanguageFromName,
  detectLanguageFromSeriesName,
  detectLanguageFromLiveName,
} from "./languageDetector";

// ---------------------------------------------------------------------------
// Public API: parseCategory
// ---------------------------------------------------------------------------

/**
 * Parse a category name to extract language and sub-category label.
 * Handles VOD patterns like "(TELUGU) (2026)", "INDIAN FHD (2024)",
 * series channel names, and live TV categories.
 */
export function parseCategory(
  categoryName: string,
  contentTypeHint?: "movies" | "series" | "live",
): { language: string; subCategory: string } | null {
  const trimmed = categoryName.trim();
  if (!trimmed) return null;

  let language: string | null = null;

  if (contentTypeHint === "series") {
    const result = detectLanguageFromSeriesName(trimmed);
    language = result.language;
  } else if (contentTypeHint === "live") {
    language = detectLanguageFromLiveName(trimmed);
  } else {
    language = detectLanguageFromName(trimmed);
  }

  if (!language) return null;

  const subCategory = stripLanguagePrefix(trimmed, language);
  return { language, subCategory };
}

// ---------------------------------------------------------------------------
// Public API: groupCategoriesByLanguage
// ---------------------------------------------------------------------------

/**
 * Group categories by language.
 * Categories that don't match any language go into "Other".
 */
export function groupCategoriesByLanguage(
  categories: XtreamCategory[],
  contentTypeHint?: "movies" | "series" | "live",
): LanguageGroup[] {
  const groups = new Map<string, LanguageGroup>();

  for (const cat of categories) {
    let language = "Other";
    let channelName: string | null = null;
    let year: number | undefined;
    let quality: string | undefined;
    let isCam: boolean | undefined;

    if (contentTypeHint === "series") {
      const result = detectLanguageFromSeriesName(cat.name);
      if (result.language) {
        language = result.language;
        channelName = result.channelName;
      }
    } else if (contentTypeHint === "live") {
      const detected = detectLanguageFromLiveName(cat.name);
      if (detected) language = detected;
    } else {
      const detected = detectLanguageFromName(cat.name);
      if (detected) language = detected;
    }

    // Extract metadata for VOD categories
    if (contentTypeHint === "movies" || !contentTypeHint) {
      year = extractYear(cat.name);
      quality = extractQuality(cat.name);
      isCam = isCamRelease(cat.name) || undefined;
    }

    const languageKey = language.toLowerCase();

    if (!groups.has(languageKey)) {
      groups.set(languageKey, {
        language,
        languageKey,
        movies: [],
        series: [],
        live: [],
        all: [],
      });
    }

    const group = groups.get(languageKey)!;
    const displayName = buildDisplayName(
      cat.name,
      language,
      year,
      quality,
      isCam,
      channelName ?? undefined,
    );

    const subCat: SubCategory = {
      id: cat.id,
      name: displayName,
      originalName: cat.name,
      year,
      quality,
      isCam,
      channelName: channelName ?? undefined,
    };

    group.all.push(subCat);

    // Place into the right bucket
    if (contentTypeHint) {
      group[contentTypeHint].push(subCat);
    } else {
      group.movies.push(subCat); // fallback
    }
  }

  // Sort by priority
  const sorted = [...groups.values()].sort((a, b) => {
    const aIdx = LANGUAGE_PRIORITY.indexOf(a.language);
    const bIdx = LANGUAGE_PRIORITY.indexOf(b.language);
    const aRank = aIdx === -1 ? 999 : aIdx;
    const bRank = bIdx === -1 ? 999 : bIdx;
    return aRank - bRank;
  });

  return sorted;
}

// ---------------------------------------------------------------------------
// Public API: getDetectedLanguages
// ---------------------------------------------------------------------------

/**
 * Get all unique languages detected from categories.
 * Returns in priority order.
 */
export function getDetectedLanguages(
  liveCategories: XtreamCategory[],
  vodCategories: XtreamCategory[],
  seriesCategories: XtreamCategory[],
): string[] {
  const languages = new Set<string>();

  for (const cat of vodCategories) {
    const lang = detectLanguageFromName(cat.name);
    if (lang) languages.add(lang);
  }

  for (const cat of seriesCategories) {
    const result = detectLanguageFromSeriesName(cat.name);
    if (result.language) languages.add(result.language);
  }

  for (const cat of liveCategories) {
    const lang = detectLanguageFromLiveName(cat.name);
    if (lang) languages.add(lang);
  }

  // Sort by priority, with detected languages only
  return LANGUAGE_PRIORITY.filter((lang) => languages.has(lang)).concat(
    [...languages].filter((lang) => !LANGUAGE_PRIORITY.includes(lang)).sort(),
  );
}

// ---------------------------------------------------------------------------
// Public API: getCategoriesForLanguage
// ---------------------------------------------------------------------------

/**
 * Get categories for a specific language across all content types.
 */
export function getCategoriesForLanguage(
  language: string,
  liveCategories: XtreamCategory[],
  vodCategories: XtreamCategory[],
  seriesCategories: XtreamCategory[],
): { movies: SubCategory[]; series: SubCategory[]; live: SubCategory[] } {
  const liveGroups = groupCategoriesByLanguage(liveCategories, "live");
  const vodGroups = groupCategoriesByLanguage(vodCategories, "movies");
  const seriesGroups = groupCategoriesByLanguage(seriesCategories, "series");

  const langKey = language.toLowerCase();

  return {
    movies: vodGroups.find((g) => g.languageKey === langKey)?.movies ?? [],
    series: seriesGroups.find((g) => g.languageKey === langKey)?.series ?? [],
    live: liveGroups.find((g) => g.languageKey === langKey)?.live ?? [],
  };
}

// ---------------------------------------------------------------------------
// Public API: per-content-type helpers
// ---------------------------------------------------------------------------

/**
 * Get all movie (VOD) category IDs for a given language.
 * Merges all year/quality/CAM variants into a single list.
 */
export function getMovieCategoriesForLanguage(
  language: string,
  vodCategories: XtreamCategory[],
): SubCategory[] {
  const groups = groupCategoriesByLanguage(vodCategories, "movies");
  const langKey = language.toLowerCase();
  return groups.find((g) => g.languageKey === langKey)?.movies ?? [];
}

/**
 * Get all series category IDs for a given language.
 * Uses channel-to-language mapping for series.
 */
export function getSeriesCategoriesForLanguage(
  language: string,
  seriesCategories: XtreamCategory[],
): SubCategory[] {
  const groups = groupCategoriesByLanguage(seriesCategories, "series");
  const langKey = language.toLowerCase();
  return groups.find((g) => g.languageKey === langKey)?.series ?? [];
}

/**
 * Get all live TV category IDs for a given language.
 */
export function getLiveCategoriesForLanguage(
  language: string,
  liveCategories: XtreamCategory[],
): SubCategory[] {
  const groups = groupCategoriesByLanguage(liveCategories, "live");
  const langKey = language.toLowerCase();
  return groups.find((g) => g.languageKey === langKey)?.live ?? [];
}
