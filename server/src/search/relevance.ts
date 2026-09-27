import type { FoodItem } from '../cache';

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function tokenize(value: string): string[] {
  return normalizeText(value).split(' ').filter(Boolean);
}

export function singularPluralForms(token: string): string[] {
  const forms = new Set<string>([token]);
  if (token.endsWith('ies') && token.length > 4) {
    forms.add(token.slice(0, -3) + 'y');
  }
  if (token.endsWith('es') && token.length > 3) {
    forms.add(token.slice(0, -2));
    forms.add(token.slice(0, -1));
  }
  if (token.endsWith('s') && token.length > 3 && !token.endsWith('ss')) {
    forms.add(token.slice(0, -1));
  }
  if (!token.endsWith('s')) {
    forms.add(token + 's');
    if (token.endsWith('y') && token.length > 2) {
      forms.add(token.slice(0, -1) + 'ies');
    }
  }
  return [...forms];
}

function wordBoundaryIncludes(text: string, word: string): boolean {
  if (!word) return false;
  const re = new RegExp(`\\b${escapeRegex(word)}\\b`, 'i');
  return re.test(text);
}

const VARIANT_PREFIXES = new Set([
  'dried', 'green', 'red', 'raw', 'fresh', 'frozen', 'canned', 'organic',
  'whole', 'sweet', 'yellow', 'white', 'brown', 'black', 'ripe', 'baby',
]);

const PROCESSED_VARIANT_WORDS = new Set([
  'dried', 'canned', 'frozen', 'smoked', 'fried', 'roasted', 'baked',
  'pickled', 'sweetened', 'powdered', 'processed', 'jarred', 'salted',
]);

const DERIVATIVE_PRODUCT_WORDS = new Set([
  'juice', 'beverage', 'drink', 'drinks', 'soda', 'smoothie', 'nectar',
  'sauce', 'syrup', 'candy', 'bar', 'bars', 'cookie', 'cookies', 'cake',
  'chip', 'chips', 'cracker', 'crackers', 'spread', 'powder', 'extract',
  'oil', 'flour', 'snack', 'cereal', 'yogurt', 'wine', 'beer', 'cocktail',
  'punch', 'tea', 'coffee', 'milkshake', 'infant', 'formula',
]);

interface ParsedName {
  primary: string;
  primaryDisplay: string;
  segments: string[];
  full: string;
  primaryTokens: string[];
}

function parseName(item: FoodItem): ParsedName {
  const sourceText = item.rawName ?? item.name;
  const segmentsRaw = sourceText.split(',').map((s) => s.trim()).filter(Boolean);
  const primaryDisplay = segmentsRaw[0] ?? sourceText;
  const primary = normalizeText(primaryDisplay);
  const segments = segmentsRaw.map((s) => normalizeText(s));
  return {
    primary,
    primaryDisplay,
    segments,
    full: normalizeText(sourceText),
    primaryTokens: tokenize(primaryDisplay),
  };
}

function scoreTokenMatch(token: string, parsed: ParsedName): number {
  let best = 0;

  if (parsed.primary === token) {
    best = Math.max(best, 1000);
  }

  if (parsed.primaryTokens.length === 1 && parsed.primaryTokens[0] === token) {
    best = Math.max(best, 980);
  }

  if (parsed.primaryTokens[0] === token) {
    best = Math.max(best, 920);
  }

  if (wordBoundaryIncludes(parsed.primary, token)) {
    best = Math.max(best, 820);

    const idx = parsed.primaryTokens.indexOf(token);
    if (idx > 0 && VARIANT_PREFIXES.has(parsed.primaryTokens[0])) {
      best = Math.max(best, 880);
    }
  }

  const inPrimary = wordBoundaryIncludes(parsed.primary, token);
  const inSecondary = parsed.segments.slice(1).some((seg) => wordBoundaryIncludes(seg, token));

  if (!inPrimary && inSecondary) {
    best = Math.max(best, 120);
  }

  if (!inPrimary && wordBoundaryIncludes(parsed.full, token)) {
    best = Math.max(best, 280);
  }

  if (!wordBoundaryIncludes(parsed.primary, token) && parsed.primary.includes(token)) {
    best = Math.max(best, 180);
  }

  return best;
}

function derivativePenalty(parsed: ParsedName, queryTokens: string[]): number {
  if (queryTokens.length !== 1) return 0;

  const queryForms = singularPluralForms(queryTokens[0]);
  const primaryHasQuery = queryForms.some((f) => wordBoundaryIncludes(parsed.primary, f));
  if (!primaryHasQuery) return 0;

  let penalty = 0;
  for (const word of parsed.primaryTokens) {
    if (DERIVATIVE_PRODUCT_WORDS.has(word) && !queryForms.includes(word)) {
      penalty += 380;
    }
  }
  return penalty;
}

function secondaryIngredientPenalty(parsed: ParsedName, queryTokens: string[]): number {
  const queryForms = queryTokens.flatMap(singularPluralForms);
  const primaryMatch = queryForms.some((f) => wordBoundaryIncludes(parsed.primary, f));
  if (primaryMatch) return 0;

  const secondaryMatch = parsed.segments.slice(1).some((seg) =>
    queryForms.some((f) => wordBoundaryIncludes(seg, f)),
  );
  if (secondaryMatch) return 450;
  return 0;
}

function secondaryVariantPenalty(parsed: ParsedName): number {
  const secondaryWords = parsed.segments
    .slice(1)
    .flatMap((segment) => tokenize(segment));

  let penalty = 0;
  for (const word of secondaryWords) {
    if (PROCESSED_VARIANT_WORDS.has(word)) {
      penalty += 180;
    }
  }

  return penalty;
}

export function scoreRelevance(item: FoodItem, query: string): number {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return 0;

  const parsed = parseName(item);
  let score = 0;

  for (const qt of queryTokens) {
    const variants = singularPluralForms(qt);
    let tokenBest = 0;
    for (const variant of variants) {
      tokenBest = Math.max(tokenBest, scoreTokenMatch(variant, parsed));
    }
    score += tokenBest;
  }

  const phrase = normalizeText(query);
  if (phrase.includes(' ')) {
    if (parsed.primary === phrase) score += 600;
    else if (wordBoundaryIncludes(parsed.primary, phrase)) score += 250;
  }

  score -= derivativePenalty(parsed, queryTokens);
  score -= secondaryIngredientPenalty(parsed, queryTokens);
  score -= secondaryVariantPenalty(parsed);

  return score;
}

export function rankByRelevance(items: FoodItem[], query: string): FoodItem[] {
  return [...items].sort((a, b) => {
    const byScore = scoreRelevance(b, query) - scoreRelevance(a, query);
    if (byScore !== 0) return byScore;
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
  });
}
