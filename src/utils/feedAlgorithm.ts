/**
 * Feed Algorithm Utilities
 * Provides deterministic pseudo-random shuffling (Mulberry32)
 * and intelligent interleaving with anti-clustering for rich, dynamic feeds.
 */

// Mulberry32 PRNG
export function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Deterministically shuffles an array using Fisher-Yates with a Mulberry32 seed.
 */
export function shuffleWithSeed<T>(items: readonly T[], seed: number): T[] {
  const result = [...items];
  const nextRandom = mulberry32(seed);

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(nextRandom() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

/**
 * Shuffles items and minimizes consecutive streaks of the same category/property (e.g. subject).
 */
export function alternateByProperty<T>(
  items: readonly T[],
  getProperty: (item: T) => string | undefined,
  seed: number,
): T[] {
  if (items.length <= 2) return [...items];

  // First shuffle everything
  const shuffled = shuffleWithSeed(items, seed);
  const result: T[] = [];
  const remaining = [...shuffled];

  while (remaining.length > 0) {
    const lastItem = result[result.length - 1];
    const lastProp = lastItem ? getProperty(lastItem)?.toLowerCase() : undefined;

    // Find candidate with different property
    let candidateIndex = -1;
    if (lastProp) {
      candidateIndex = remaining.findIndex(
        (candidate) => getProperty(candidate)?.toLowerCase() !== lastProp,
      );
    }

    // If none found or first item, pick from head
    if (candidateIndex === -1) {
      candidateIndex = 0;
    }

    result.push(remaining.splice(candidateIndex, 1)[0]);
  }

  return result;
}

export type InterleaveBucket<T> = {
  type: string;
  items: T[];
  weight?: number; // relative frequency weight (default 1)
};

export type InterleaveOptions<T> = {
  buckets: InterleaveBucket<T>[];
  seed: number;
  getItemType: (item: T) => string;
  getItemSubject?: (item: T) => string | undefined;
  breakItems?: T[];
  breakInterval?: number; // insert a break item every N feed items
};

/**
 * Interleaves items from multiple content buckets into a unified, dynamic stream.
 * Prevents consecutive items of the same type and subject, and injects break items (e.g. carousels).
 */
export function interleaveFeedItems<T>({
  buckets,
  seed,
  getItemType,
  getItemSubject,
  breakItems = [],
  breakInterval = 6,
}: InterleaveOptions<T>): T[] {
  const nextRandom = mulberry32(seed);

  // Shuffle each bucket's items individually
  const activeBuckets = buckets
    .map((bucket, idx) => ({
      type: bucket.type,
      weight: Math.max(1, bucket.weight ?? 1),
      queue: shuffleWithSeed(bucket.items, seed + idx * 1013),
    }))
    .filter((b) => b.queue.length > 0);

  const result: T[] = [];
  let availableBreakItems = shuffleWithSeed(breakItems, seed + 9999);
  let breakIndex = 0;
  let itemsSinceLastBreak = 0;

  const totalItemCount = activeBuckets.reduce(
    (acc, b) => acc + b.queue.length,
    0,
  );

  while (result.length < totalItemCount + availableBreakItems.length) {
    // Check if we should insert a break item (e.g. carousel)
    if (
      breakInterval > 0 &&
      itemsSinceLastBreak >= breakInterval &&
      breakIndex < availableBreakItems.length
    ) {
      result.push(availableBreakItems[breakIndex]);
      breakIndex++;
      itemsSinceLastBreak = 0;
      continue;
    }

    // Filter buckets that still have items
    const availableBuckets = activeBuckets.filter((b) => b.queue.length > 0);
    if (availableBuckets.length === 0) break;

    const lastItem = result[result.length - 1];
    const lastType = lastItem ? getItemType(lastItem) : undefined;
    const lastSubject = lastItem && getItemSubject ? getItemSubject(lastItem)?.toLowerCase() : undefined;

    // Prefer buckets whose type is not equal to lastType
    let candidateBuckets = availableBuckets.filter((b) => b.type !== lastType);
    if (candidateBuckets.length === 0) {
      candidateBuckets = availableBuckets;
    }

    // If subject anti-clustering is available, score candidates
    if (lastSubject && getItemSubject) {
      const diffSubjectBuckets = candidateBuckets.filter((b) => {
        const topItem = b.queue[0];
        return getItemSubject(topItem)?.toLowerCase() !== lastSubject;
      });
      if (diffSubjectBuckets.length > 0) {
        candidateBuckets = diffSubjectBuckets;
      }
    }

    // Select candidate bucket probabilistically weighted
    const totalWeight = candidateBuckets.reduce((acc, b) => acc + b.weight, 0);
    let randomThreshold = nextRandom() * totalWeight;
    let chosenBucket = candidateBuckets[0];

    for (const b of candidateBuckets) {
      randomThreshold -= b.weight;
      if (randomThreshold <= 0) {
        chosenBucket = b;
        break;
      }
    }

    // Dequeue item from chosen bucket
    const chosenItem = chosenBucket.queue.shift();
    if (chosenItem) {
      result.push(chosenItem);
      itemsSinceLastBreak++;
    }
  }

  // If any remaining break items exist, append at the end
  while (breakIndex < availableBreakItems.length) {
    result.push(availableBreakItems[breakIndex]);
    breakIndex++;
  }

  return result;
}
