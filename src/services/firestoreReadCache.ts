type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const values = new Map<string, CacheEntry<unknown>>();
const inFlight = new Map<string, Promise<unknown>>();

export type FirestoreReadOptions = {
  ttlMs?: number;
  force?: boolean;
};

export async function readThroughFirestoreCache<T>(
  key: string,
  loader: () => Promise<T>,
  { ttlMs = 5 * 60 * 1000, force = false }: FirestoreReadOptions = {},
): Promise<T> {
  const cached = values.get(key);
  if (!force && cached && cached.expiresAt > Date.now()) {
    return cached.value as T;
  }

  const pending = inFlight.get(key);
  if (pending) return pending as Promise<T>;

  const request = loader()
    .then((value) => {
      values.set(key, { value, expiresAt: Date.now() + ttlMs });
      return value;
    })
    .finally(() => {
      inFlight.delete(key);
    });

  inFlight.set(key, request);
  return request;
}

export function invalidateFirestoreReadCache(...keys: string[]): void {
  if (keys.length === 0) {
    values.clear();
    return;
  }
  keys.forEach((key) => values.delete(key));
}
