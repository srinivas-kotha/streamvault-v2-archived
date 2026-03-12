import type { XtreamCategory } from '@shared/types/api';

export interface SubCategory {
  id: string;
  name: string;
  originalName: string;
}

export interface LanguageGroup {
  language: string;
  languageKey: string; // lowercase, URL-safe: "telugu", "hindi", "english"
  movies: SubCategory[];
  series: SubCategory[];
  live: SubCategory[];
  all: SubCategory[]; // all sub-categories before type classification
}

// Known language aliases -> canonical name
const LANGUAGE_ALIASES: Record<string, string> = {
  telugu: 'Telugu',
  tel: 'Telugu',
  te: 'Telugu',
  hindi: 'Hindi',
  hin: 'Hindi',
  hi: 'Hindi',
  english: 'English',
  eng: 'English',
  en: 'English',
  tamil: 'Tamil',
  tam: 'Tamil',
  ta: 'Tamil',
  kannada: 'Kannada',
  kan: 'Kannada',
  ka: 'Kannada',
  malayalam: 'Malayalam',
  mal: 'Malayalam',
  ml: 'Malayalam',
  bengali: 'Bengali',
  ben: 'Bengali',
  bn: 'Bengali',
  marathi: 'Marathi',
  mar: 'Marathi',
  mr: 'Marathi',
  punjabi: 'Punjabi',
  pan: 'Punjabi',
  pa: 'Punjabi',
  gujarati: 'Gujarati',
  guj: 'Gujarati',
  gu: 'Gujarati',
  urdu: 'Urdu',
  urd: 'Urdu',
  ur: 'Urdu',
  korean: 'Korean',
  kor: 'Korean',
  ko: 'Korean',
  japanese: 'Japanese',
  jpn: 'Japanese',
  ja: 'Japanese',
  arabic: 'Arabic',
  ara: 'Arabic',
  ar: 'Arabic',
  spanish: 'Spanish',
  spa: 'Spanish',
  es: 'Spanish',
  french: 'French',
  fra: 'French',
  fr: 'French',
  german: 'German',
  deu: 'German',
  de: 'German',
  portuguese: 'Portuguese',
  por: 'Portuguese',
  pt: 'Portuguese',
  italian: 'Italian',
  ita: 'Italian',
  it: 'Italian',
  chinese: 'Chinese',
  zho: 'Chinese',
  zh: 'Chinese',
  russian: 'Russian',
  rus: 'Russian',
  ru: 'Russian',
  turkish: 'Turkish',
  tur: 'Turkish',
  tr: 'Turkish',
  thai: 'Thai',
  tha: 'Thai',
  th: 'Thai',
  dutch: 'Dutch',
  nld: 'Dutch',
  nl: 'Dutch',
  polish: 'Polish',
  pol: 'Polish',
  pl: 'Polish',
  // Indian language variations
  'telugu language': 'Telugu',
  'hindi language': 'Hindi',
  'english language': 'English',
};

// Priority order for display (Telugu first as user's primary)
const LANGUAGE_PRIORITY: string[] = [
  'Telugu', 'Hindi', 'English', 'Tamil', 'Kannada', 'Malayalam',
  'Bengali', 'Marathi', 'Punjabi', 'Gujarati', 'Urdu',
  'Korean', 'Japanese', 'Arabic', 'Spanish', 'French', 'German',
];

// Patterns that indicate content type
const MOVIE_KEYWORDS = /\b(movie|movies|film|films|cinema|bollywood|tollywood|kollywood|4k|uhd|hd|latest|new|classic|old|dubbed|web.?dl|cam|dvd|bluray|blu.?ray)\b/i;
const SERIES_KEYWORDS = /\b(series|serial|serials|show|shows|drama|dramas|web.?series|webseries|tv.?show|season)\b/i;
const LIVE_KEYWORDS = /\b(live|channel|channels|tv|television|news|sports|kids|music|entertainment|general|regional|religious)\b/i;

/**
 * Parse a category name to extract language and sub-category.
 * Handles separators: | : - -- -- and space-only patterns.
 */
export function parseCategory(categoryName: string): { language: string; subCategory: string } | null {
  const trimmed = categoryName.trim();
  if (!trimmed) return null;

  // Try separator patterns: pipe, colon, dash, en-dash, em-dash
  const separatorMatch = trimmed.match(/^([A-Za-z\s]+?)\s*[|:\-\u2013\u2014]\s*(.+)$/);
  if (separatorMatch && separatorMatch[1] && separatorMatch[2]) {
    const langRaw = separatorMatch[1].trim().toLowerCase();
    const subCat = separatorMatch[2].trim();
    const canonical = LANGUAGE_ALIASES[langRaw];
    if (canonical) {
      return { language: canonical, subCategory: subCat };
    }
  }

  // Try space-only split: "TELUGU MOVIES", "HINDI SERIES"
  const words = trimmed.split(/\s+/);
  if (words.length >= 2) {
    const firstWord = words[0]!.toLowerCase();
    const canonical = LANGUAGE_ALIASES[firstWord];
    if (canonical) {
      return { language: canonical, subCategory: words.slice(1).join(' ') };
    }
  }

  // Try if the entire name is a known language (e.g., category named just "Telugu")
  const wholeLower = trimmed.toLowerCase();
  const wholeCanonical = LANGUAGE_ALIASES[wholeLower];
  if (wholeCanonical) {
    return { language: wholeCanonical, subCategory: 'General' };
  }

  return null;
}

/**
 * Classify a sub-category name into movies, series, or live.
 */
export function classifyContentType(subCategory: string): 'movies' | 'series' | 'live' | 'unknown' {
  if (MOVIE_KEYWORDS.test(subCategory)) return 'movies';
  if (SERIES_KEYWORDS.test(subCategory)) return 'series';
  if (LIVE_KEYWORDS.test(subCategory)) return 'live';
  return 'unknown';
}

/**
 * Clean up sub-category name for display.
 * "MOVIES HD" -> "HD", "4K MOVIES" -> "4K"
 */
function cleanSubCategoryName(name: string): string {
  return name
    .replace(/\b(movie|movies|film|films|series|serial|serials|show|shows|live|channel|channels|tv)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim() || name;
}

/**
 * Group categories by language.
 * Categories that don't match any language go into "Other".
 */
export function groupCategoriesByLanguage(
  categories: XtreamCategory[],
  contentTypeHint?: 'movies' | 'series' | 'live'
): LanguageGroup[] {
  const groups = new Map<string, LanguageGroup>();

  for (const cat of categories) {
    const parsed = parseCategory(cat.category_name);
    const language = parsed?.language ?? 'Other';
    const languageKey = language.toLowerCase();
    const subCatName = parsed?.subCategory ?? cat.category_name;

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
    const subCat: SubCategory = {
      id: cat.category_id,
      name: cleanSubCategoryName(subCatName),
      originalName: cat.category_name,
    };

    group.all.push(subCat);

    // Classify based on sub-category name or hint
    const type = contentTypeHint ?? classifyContentType(subCatName);
    if (type === 'movies') group.movies.push(subCat);
    else if (type === 'series') group.series.push(subCat);
    else if (type === 'live') group.live.push(subCat);
    else {
      // If unknown type and we have a hint, use the hint
      if (contentTypeHint) {
        group[contentTypeHint].push(subCat);
      } else {
        // Default: add to all but no specific bucket
        group.movies.push(subCat); // fallback
      }
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

/**
 * Get all unique languages detected from categories.
 * Returns in priority order.
 */
export function getDetectedLanguages(
  liveCategories: XtreamCategory[],
  vodCategories: XtreamCategory[],
  seriesCategories: XtreamCategory[]
): string[] {
  const allCategories = [...liveCategories, ...vodCategories, ...seriesCategories];
  const languages = new Set<string>();

  for (const cat of allCategories) {
    const parsed = parseCategory(cat.category_name);
    if (parsed) languages.add(parsed.language);
  }

  // Sort by priority, with detected languages only
  return LANGUAGE_PRIORITY.filter((lang) => languages.has(lang)).concat(
    [...languages].filter((lang) => !LANGUAGE_PRIORITY.includes(lang)).sort()
  );
}

/**
 * Get categories for a specific language across all content types.
 */
export function getCategoriesForLanguage(
  language: string,
  liveCategories: XtreamCategory[],
  vodCategories: XtreamCategory[],
  seriesCategories: XtreamCategory[]
): { movies: SubCategory[]; series: SubCategory[]; live: SubCategory[] } {
  const liveGroups = groupCategoriesByLanguage(liveCategories, 'live');
  const vodGroups = groupCategoriesByLanguage(vodCategories, 'movies');
  const seriesGroups = groupCategoriesByLanguage(seriesCategories, 'series');

  const langKey = language.toLowerCase();

  return {
    movies: vodGroups.find((g) => g.languageKey === langKey)?.movies ?? [],
    series: seriesGroups.find((g) => g.languageKey === langKey)?.series ?? [],
    live: liveGroups.find((g) => g.languageKey === langKey)?.live ?? [],
  };
}
