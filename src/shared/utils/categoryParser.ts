import type { XtreamCategory } from '@shared/types/api';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface SubCategory {
  id: string;
  name: string;
  originalName: string;
  /** Year extracted from category name, e.g. 2026 */
  year?: number;
  /** Quality tag: "4K", "FHD", "HD" */
  quality?: string;
  /** True if category name contains (CAM) */
  isCam?: boolean;
  /** For series: the TV channel / platform name this category represents */
  channelName?: string;
}

export interface LanguageGroup {
  language: string;
  languageKey: string; // lowercase, URL-safe: "telugu", "hindi", "english"
  movies: SubCategory[];
  series: SubCategory[];
  live: SubCategory[];
  all: SubCategory[]; // all sub-categories before type classification
}

// ---------------------------------------------------------------------------
// Language aliases -> canonical name
// ---------------------------------------------------------------------------

const LANGUAGE_ALIASES: Record<string, string> = {
  // Telugu
  telugu: 'Telugu',
  tel: 'Telugu',
  te: 'Telugu',
  // Hindi / Indian (generic "INDIAN" maps to Hindi)
  hindi: 'Hindi',
  hin: 'Hindi',
  hi: 'Hindi',
  indian: 'Hindi',
  bollywood: 'Hindi',
  'south indian hindi dubbed': 'Hindi',
  // English
  english: 'English',
  eng: 'English',
  en: 'English',
  // Tamil
  tamil: 'Tamil',
  tam: 'Tamil',
  ta: 'Tamil',
  // Kannada
  kannada: 'Kannada',
  kan: 'Kannada',
  ka: 'Kannada',
  // Malayalam
  malayalam: 'Malayalam',
  mal: 'Malayalam',
  ml: 'Malayalam',
  // Bengali (including BANGLA alias)
  bengali: 'Bengali',
  ben: 'Bengali',
  bn: 'Bengali',
  bangla: 'Bengali',
  // Marathi
  marathi: 'Marathi',
  mar: 'Marathi',
  mr: 'Marathi',
  // Punjabi
  punjabi: 'Punjabi',
  pan: 'Punjabi',
  pa: 'Punjabi',
  // Gujarati (including common misspelling)
  gujarati: 'Gujarati',
  gujrati: 'Gujarati',
  guj: 'Gujarati',
  gu: 'Gujarati',
  // Urdu
  urdu: 'Urdu',
  urd: 'Urdu',
  ur: 'Urdu',
  // Pakistani (maps to Urdu for language grouping)
  pakistan: 'Pakistani',
  pakistani: 'Pakistani',
  // Korean
  korean: 'Korean',
  kor: 'Korean',
  ko: 'Korean',
  // Japanese
  japanese: 'Japanese',
  jpn: 'Japanese',
  ja: 'Japanese',
  // Arabic
  arabic: 'Arabic',
  ara: 'Arabic',
  ar: 'Arabic',
  // Spanish
  spanish: 'Spanish',
  spa: 'Spanish',
  es: 'Spanish',
  // French
  french: 'French',
  fra: 'French',
  fr: 'French',
  // German
  german: 'German',
  deu: 'German',
  de: 'German',
  // Portuguese
  portuguese: 'Portuguese',
  por: 'Portuguese',
  pt: 'Portuguese',
  // Italian
  italian: 'Italian',
  ita: 'Italian',
  it: 'Italian',
  // Chinese
  chinese: 'Chinese',
  zho: 'Chinese',
  zh: 'Chinese',
  // Russian
  russian: 'Russian',
  rus: 'Russian',
  ru: 'Russian',
  // Turkish
  turkish: 'Turkish',
  tur: 'Turkish',
  tr: 'Turkish',
  // Thai
  thai: 'Thai',
  tha: 'Thai',
  th: 'Thai',
  // Dutch
  dutch: 'Dutch',
  nld: 'Dutch',
  nl: 'Dutch',
  // Polish
  polish: 'Polish',
  pol: 'Polish',
  pl: 'Polish',
};

// ---------------------------------------------------------------------------
// Series: TV channel / platform -> language mapping
// ---------------------------------------------------------------------------

const CHANNEL_TO_LANGUAGE: Record<string, string> = {
  // --- Telugu channels ---
  'star maa': 'Telugu',
  'zee telugu': 'Telugu',
  'gemini': 'Telugu',
  'etv': 'Telugu',
  'etv telugu': 'Telugu',
  'sony telugu': 'Telugu',
  'aha': 'Telugu',
  'etv plus': 'Telugu',
  'maa movies': 'Telugu',
  'maa gold': 'Telugu',
  'maa tv': 'Telugu',

  // --- Hindi channels ---
  'colors hindi': 'Hindi',
  'colors': 'Hindi',
  'sony (set)': 'Hindi',
  'sony set': 'Hindi',
  'star plus': 'Hindi',
  'star bharat': 'Hindi',
  'zee tv': 'Hindi',
  'sab': 'Hindi',
  'and tv': 'Hindi',
  'mtv hindi': 'Hindi',
  'mtv': 'Hindi',
  'sun neo hindi': 'Hindi',
  'hindi tv series': 'Hindi',
  'indian reality shows': 'Hindi',
  'bigg boss ott': 'Hindi',
  'dangal tv': 'Hindi',
  'ishara tv': 'Hindi',
  'shemaroo': 'Hindi',
  'epic tv': 'Hindi',
  'dd national': 'Hindi',
  'dd bharati': 'Hindi',
  'zee anmol': 'Hindi',
  'sony pal': 'Hindi',
  'big magic': 'Hindi',
  'bindass': 'Hindi',
  'zee cinema': 'Hindi',
  'star gold': 'Hindi',
  'sony max': 'Hindi',
  'bollywood': 'Hindi',

  // --- Tamil channels ---
  'star vijay': 'Tamil',
  'vijay': 'Tamil',
  'zee tamil': 'Tamil',
  'sun tamil': 'Tamil',
  'sun tv': 'Tamil',
  'color tamil': 'Tamil',
  'colors tamil': 'Tamil',
  'sony tamil': 'Tamil',
  'tamil tv series': 'Tamil',
  'ktv': 'Tamil',
  'jaya tv': 'Tamil',
  'polimer': 'Tamil',
  'raj tv': 'Tamil',
  'adithya tv': 'Tamil',

  // --- Malayalam channels ---
  'asianet': 'Malayalam',
  'zee malayalam': 'Malayalam',
  'surya malayalam': 'Malayalam',
  'surya tv': 'Malayalam',
  'mazhavil manorama': 'Malayalam',
  'flowers tv': 'Malayalam',
  'manorama': 'Malayalam',
  'amrita tv': 'Malayalam',
  'kairali tv': 'Malayalam',

  // --- Kannada channels ---
  'star suvarna': 'Kannada',
  'zee kannada': 'Kannada',
  'colors kannada': 'Kannada',
  'udaya kannada': 'Kannada',
  'udaya tv': 'Kannada',
  'public tv': 'Kannada',
  'kasturi tv': 'Kannada',

  // --- Marathi channels ---
  'star pravah': 'Marathi',
  'zee marathi': 'Marathi',
  'colors marathi': 'Marathi',
  'sony marathi': 'Marathi',
  'sun marathi': 'Marathi',
  'fakt marathi': 'Marathi',

  // --- Bengali channels ---
  'star jalsha': 'Bengali',
  'zee bangla': 'Bengali',
  'sun bangla': 'Bengali',
  'colors bangla': 'Bengali',
  'sony aath': 'Bengali',
  'hoichoi': 'Bengali',
  'chorki/bangla': 'Bengali',
  'chorki': 'Bengali',
  'jalsha movies': 'Bengali',

  // --- Gujarati channels ---
  'colors gujarati': 'Gujarati',

  // --- Punjabi channels ---
  'zee punjabi': 'Punjabi',
  'punjabi tv series': 'Punjabi',
  'chaupal': 'Punjabi',
  'ptc punjabi': 'Punjabi',

  // --- Urdu channels ---
  'urdu 1': 'Urdu',
  'urdu flix': 'Urdu',
  'urdu tv series': 'Urdu',

  // --- Pakistani channels (grouped under Pakistani) ---
  'hum tv': 'Pakistani',
  'geo tv': 'Pakistani',
  'ary digital': 'Pakistani',
  'green tv entertainment': 'Pakistani',
  'express tv': 'Pakistani',
  'geo news': 'Pakistani',
  'play entertainment': 'Pakistani',
  'mun tv': 'Pakistani',
  'tv one': 'Pakistani',
  'ptv home': 'Pakistani',
  'aplus tv': 'Pakistani',
  'aan tv': 'Pakistani',
  'aur life': 'Pakistani',
  'pakistani drama': 'Pakistani',
  'ary news': 'Pakistani',
  'ary zindagi': 'Pakistani',
  'hum sitaray': 'Pakistani',
  'a-plus': 'Pakistani',

  // --- Multi-language / OTT platforms (English/Mixed) ---
  'netflix': 'English',
  'netflix (multi language)': 'English',
  'netflix movies hindi': 'Hindi',
  'netflix movies english': 'English',
  'amazon prime': 'English',
  'hbo max': 'English',
  'disney+hotstar': 'Hindi',
  'disney+ hotstar': 'Hindi',
  'hotstar': 'Hindi',
  'jio cinema': 'Hindi',
  'jio': 'Hindi',
  'zee5+alt balaji': 'Hindi',
  'zee5': 'Hindi',
  'alt balaji': 'Hindi',
  'sony liv': 'Hindi',
  'mx player': 'Hindi',
  'voot': 'Hindi',
  'hungama play': 'Hindi',
  'starz': 'English',
  'apple tv+': 'English',
  'apple tv': 'English',
  'eros now': 'Hindi',
  'lionsgate play': 'English',
  'paramount+': 'English',
  'peacock': 'English',
  'hulu': 'English',
  'crunchyroll': 'Japanese',

  // --- English / International channels ---
  'bbc': 'English',
  'nbc': 'English',
  'abc': 'English',
  'cbs': 'English',
  'fox': 'English',
  'fx': 'English',
  'hbo': 'English',
  'showtime': 'English',
  'amc': 'English',
  'cw': 'English',
  'usa network': 'English',
  'syfy': 'English',
  'tnt': 'English',
  'tbs': 'English',
  'bravo': 'English',
  'discovery': 'English',
  'history': 'English',
  'tlc': 'English',
  'nat geo': 'English',
  'national geographic': 'English',
  'lifetime': 'English',
  'hallmark': 'English',
  'a&e': 'English',
  'comedy central': 'English',
  'cartoon network': 'English',
  'nickelodeon': 'English',
  'disney': 'English',
  'espn': 'English',
  'sky': 'English',
  'itv': 'English',
  'channel 4': 'English',
  'channel 5': 'English',
  'dave': 'English',

  // --- Turkish ---
  'turkish': 'Turkish',

  // --- Korean ---
  'korean (multi language)': 'Korean',
  'jtbc': 'Korean',
  'tving': 'Korean',
  'kbs': 'Korean',
  'mbc': 'Korean',
  'sbs': 'Korean',
  'tvn': 'Korean',
};

// ---------------------------------------------------------------------------
// Live TV: keyword/prefix -> language mapping
// ---------------------------------------------------------------------------

const LIVE_CATEGORY_MAP: Record<string, string> = {
  // Telugu
  'telugu': 'Telugu',
  'telugu movies 24/7': 'Telugu',

  // Hindi / Indian
  'india entertainment': 'Hindi',
  'india hindi movies': 'Hindi',
  'india documentary': 'Hindi',
  'india music': 'Hindi',
  'indian news': 'Hindi',
  'indian sd': 'Hindi',
  'indian active': 'Hindi',
  'bollywood movies/actors 24/7': 'Hindi',
  'bollywood singers 24/7': 'Hindi',
  'bollywood movies 24/7': 'Hindi',
  'hindi web series 24x7': 'Hindi',
  'india english movies': 'English',

  // Tamil
  'tamil': 'Tamil',
  'tamil | news': 'Tamil',
  'tamil | entertainment': 'Tamil',
  'tamil | movies': 'Tamil',

  // Malayalam
  'malayalam | movies': 'Malayalam',
  'malayalam | news': 'Malayalam',
  'malayalam | songs': 'Malayalam',
  'malayalam | entrtnmnt': 'Malayalam',

  // Kannada
  'kannada': 'Kannada',
  'kannada movies 24/7': 'Kannada',

  // English
  'english news': 'English',
  'uk| entertainment': 'English',
  'uk| movies': 'English',
  'english movies 24/7': 'English',
  'uk entertainment': 'English',
  'uk movies': 'English',
  'us entertainment': 'English',
  'us movies': 'English',
};

// ---------------------------------------------------------------------------
// Priority order for display (Telugu first as user's primary)
// ---------------------------------------------------------------------------

const LANGUAGE_PRIORITY: string[] = [
  'Telugu', 'Hindi', 'English', 'Tamil', 'Kannada', 'Malayalam',
  'Bengali', 'Marathi', 'Punjabi', 'Gujarati', 'Urdu', 'Pakistani',
  'Korean', 'Japanese', 'Arabic', 'Spanish', 'French', 'German',
  'Turkish', 'Thai', 'Chinese', 'Russian', 'Portuguese', 'Italian',
  'Dutch', 'Polish',
];

// ---------------------------------------------------------------------------
// Metadata extraction helpers
// ---------------------------------------------------------------------------

/** Extract a 4-digit year like (2026) or standalone 2025 near parens */
function extractYear(name: string): number | undefined {
  // Match (2019)-(2026) or standalone 20xx at word boundary
  const m = name.match(/\b((?:19|20)\d{2})\b/);
  return m ? parseInt(m[1]!, 10) : undefined;
}

/** Extract quality tag: 4K, FHD, HD */
function extractQuality(name: string): string | undefined {
  const m = name.match(/\b(4K|FHD|UHD|HD|BluRay|Blu[- ]?Ray|WEB[- ]?DL)\b/i);
  return m ? m[1]!.toUpperCase() : undefined;
}

/** Check if category name contains CAM indicator */
function isCamRelease(name: string): boolean {
  return /\(CAM\)/i.test(name);
}

/**
 * Strip metadata suffixes from a category name to get a clean display name.
 * "(TELUGU) (2026)" -> "2026"
 * "TELUGU (2025) (CAM)" -> "2025 CAM"
 * "INDIAN FHD (2024)" -> "FHD 2024"
 * "TELUGU" -> "All"
 */
function buildDisplayName(
  originalName: string,
  language: string,
  year?: number,
  quality?: string,
  isCam?: boolean,
  channelName?: string,
): string {
  if (channelName) return channelName;

  const parts: string[] = [];
  if (quality) parts.push(quality);
  if (year) parts.push(String(year));
  if (isCam) parts.push('CAM');

  if (parts.length === 0) {
    // Check for special descriptors left after stripping language
    const stripped = stripLanguagePrefix(originalName, language);
    if (stripped && stripped !== 'General') return stripped;
    return 'All';
  }

  return parts.join(' ');
}

/**
 * Strip language prefix / known keywords from a name to get the descriptor.
 */
function stripLanguagePrefix(name: string, language: string): string {
  let result = name;

  // Remove leading parens around language: "(TELUGU)" -> ""
  result = result.replace(/^\(?\s*/i, '');

  // Remove the language keyword itself (case-insensitive)
  // Also remove known aliases that map to this language
  const aliasesToRemove = new Set<string>();
  aliasesToRemove.add(language.toLowerCase());
  for (const [alias, canonical] of Object.entries(LANGUAGE_ALIASES)) {
    if (canonical === language) aliasesToRemove.add(alias);
  }

  for (const alias of aliasesToRemove) {
    const regex = new RegExp(`\\b${escapeRegex(alias)}\\b`, 'gi');
    result = result.replace(regex, '');
  }

  // Remove years, quality, CAM, parens
  result = result
    .replace(/\b(?:19|20)\d{2}\b/g, '')
    .replace(/\b(?:4K|FHD|UHD|HD|CAM)\b/gi, '')
    .replace(/[()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return result || 'General';
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ---------------------------------------------------------------------------
// Language detection from category name
// ---------------------------------------------------------------------------

/**
 * Ordered list of language keywords to try, longest first to avoid
 * "south indian hindi dubbed" matching "indian" before the full phrase.
 */
const LANGUAGE_KEYWORDS_SORTED = Object.keys(LANGUAGE_ALIASES).sort(
  (a, b) => b.length - a.length,
);

/**
 * Detect language from a VOD or live category name.
 * Tries multiple strategies:
 * 1. Exact match on full name (after lowering)
 * 2. Leading paren match: "(TELUGU) ..."
 * 3. Separator match: "TAMIL | NEWS"
 * 4. Keyword match against LANGUAGE_ALIASES (longest-first)
 * 5. Special composite patterns: "SOUTH INDIAN HINDI DUBBED", "NETFLIX MOVIES HINDI"
 */
function detectLanguageFromName(name: string): string | null {
  const lower = name.toLowerCase().trim();

  // 1. Exact match
  if (LANGUAGE_ALIASES[lower]) return LANGUAGE_ALIASES[lower]!;

  // 2. Leading paren: "(TELUGU) (2026)" -> telugu
  const parenMatch = lower.match(/^\(([^)]+)\)/);
  if (parenMatch) {
    const inner = parenMatch[1]!.trim();
    if (LANGUAGE_ALIASES[inner]) return LANGUAGE_ALIASES[inner]!;
  }

  // 3. Separator: "TAMIL | NEWS", "MALAYALAM | MOVIES"
  const sepMatch = lower.match(/^([a-z\s]+?)\s*[|:\-\u2013\u2014]\s*/);
  if (sepMatch) {
    const prefix = sepMatch[1]!.trim();
    if (LANGUAGE_ALIASES[prefix]) return LANGUAGE_ALIASES[prefix]!;
  }

  // 4. Check for composite patterns first (before single-word keywords)
  // "SOUTH INDIAN HINDI DUBBED" -> Hindi
  if (/south\s+indian\s+hindi\s+dubbed/i.test(lower)) return 'Hindi';
  if (/english\s+hindi\s+dubbed/i.test(lower)) return 'Hindi';
  if (/netflix\s+movies?\s+hindi/i.test(lower)) return 'Hindi';
  if (/netflix\s+movies?\s+english/i.test(lower)) return 'English';
  if (/hindi\s+old\s+movies/i.test(lower)) return 'Hindi';
  if (/bollywood\s+comedy/i.test(lower)) return 'Hindi';
  if (/bollywood\s+beuties/i.test(lower)) return 'Hindi';
  if (/bollywood/i.test(lower)) return 'Hindi';

  // 5. Keyword match (longest first)
  for (const keyword of LANGUAGE_KEYWORDS_SORTED) {
    // Only match at word boundary to avoid partial matches
    const regex = new RegExp(`\\b${escapeRegex(keyword)}\\b`, 'i');
    if (regex.test(lower)) {
      return LANGUAGE_ALIASES[keyword]!;
    }
  }

  return null;
}

/**
 * Detect language from a series category name using channel mapping.
 * Falls back to keyword-based detection.
 */
function detectLanguageFromSeriesName(name: string): {
  language: string | null;
  channelName: string | null;
} {
  const lower = name.toLowerCase().trim();

  // Remove trailing category ID patterns like " (453)"
  const cleanLower = lower.replace(/\s*\(\d+\)\s*$/, '').trim();

  // 1. Exact match in channel map
  if (CHANNEL_TO_LANGUAGE[cleanLower]) {
    return {
      language: CHANNEL_TO_LANGUAGE[cleanLower]!,
      channelName: toTitleCase(cleanLower),
    };
  }

  // 2. Try progressively shorter prefixes for channels with suffixes
  // e.g., "STAR MAA HD" -> try "star maa hd", then "star maa"
  const words = cleanLower.split(/\s+/);
  for (let len = words.length; len >= 1; len--) {
    const prefix = words.slice(0, len).join(' ');
    if (CHANNEL_TO_LANGUAGE[prefix]) {
      return {
        language: CHANNEL_TO_LANGUAGE[prefix]!,
        channelName: toTitleCase(prefix),
      };
    }
  }

  // 3. Try keyword-based detection as fallback (e.g., "Tamil Tv Series")
  const lang = detectLanguageFromName(name);
  if (lang) {
    return { language: lang, channelName: null };
  }

  return { language: null, channelName: null };
}

/**
 * Detect language from a live TV category name using the live map
 * and falling back to keyword detection.
 */
function detectLanguageFromLiveName(name: string): string | null {
  const lower = name.toLowerCase().trim();

  // 1. Exact match in live map
  if (LIVE_CATEGORY_MAP[lower]) return LIVE_CATEGORY_MAP[lower]!;

  // 2. Try keyword detection
  return detectLanguageFromName(name);
}

function toTitleCase(s: string): string {
  return s
    .split(/\s+/)
    .map((w) => {
      // Keep all-caps acronyms
      if (w.length <= 3 && w === w.toUpperCase()) return w.toUpperCase();
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(' ');
}

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
  contentTypeHint?: 'movies' | 'series' | 'live',
): { language: string; subCategory: string } | null {
  const trimmed = categoryName.trim();
  if (!trimmed) return null;

  let language: string | null = null;

  if (contentTypeHint === 'series') {
    const result = detectLanguageFromSeriesName(trimmed);
    language = result.language;
  } else if (contentTypeHint === 'live') {
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
  contentTypeHint?: 'movies' | 'series' | 'live',
): LanguageGroup[] {
  const groups = new Map<string, LanguageGroup>();

  for (const cat of categories) {
    let language = 'Other';
    let channelName: string | null = null;
    let year: number | undefined;
    let quality: string | undefined;
    let isCam: boolean | undefined;

    if (contentTypeHint === 'series') {
      const result = detectLanguageFromSeriesName(cat.category_name);
      if (result.language) {
        language = result.language;
        channelName = result.channelName;
      }
    } else if (contentTypeHint === 'live') {
      const detected = detectLanguageFromLiveName(cat.category_name);
      if (detected) language = detected;
    } else {
      const detected = detectLanguageFromName(cat.category_name);
      if (detected) language = detected;
    }

    // Extract metadata for VOD categories
    if (contentTypeHint === 'movies' || !contentTypeHint) {
      year = extractYear(cat.category_name);
      quality = extractQuality(cat.category_name);
      isCam = isCamRelease(cat.category_name) || undefined;
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
      cat.category_name,
      language,
      year,
      quality,
      isCam,
      channelName ?? undefined,
    );

    const subCat: SubCategory = {
      id: cat.category_id,
      name: displayName,
      originalName: cat.category_name,
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
    const lang = detectLanguageFromName(cat.category_name);
    if (lang) languages.add(lang);
  }

  for (const cat of seriesCategories) {
    const result = detectLanguageFromSeriesName(cat.category_name);
    if (result.language) languages.add(result.language);
  }

  for (const cat of liveCategories) {
    const lang = detectLanguageFromLiveName(cat.category_name);
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
  const groups = groupCategoriesByLanguage(vodCategories, 'movies');
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
  const groups = groupCategoriesByLanguage(seriesCategories, 'series');
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
  const groups = groupCategoriesByLanguage(liveCategories, 'live');
  const langKey = language.toLowerCase();
  return groups.find((g) => g.languageKey === langKey)?.live ?? [];
}
