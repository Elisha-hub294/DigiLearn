const test = require("node:test");
const assert = require("node:assert/strict");

// Simple JS mirror or imports for the pure algorithm logic
function mulberry32(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleWithSeed(items, seed) {
  const result = [...items];
  const nextRandom = mulberry32(seed);

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(nextRandom() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

function alternateByProperty(items, getProperty, seed) {
  if (items.length <= 2) return [...items];

  const shuffled = shuffleWithSeed(items, seed);
  const result = [];
  const remaining = [...shuffled];

  while (remaining.length > 0) {
    const lastItem = result[result.length - 1];
    const lastProp = lastItem ? getProperty(lastItem)?.toLowerCase() : undefined;

    let candidateIndex = -1;
    if (lastProp) {
      candidateIndex = remaining.findIndex(
        (candidate) => getProperty(candidate)?.toLowerCase() !== lastProp,
      );
    }

    if (candidateIndex === -1) {
      candidateIndex = 0;
    }

    result.push(remaining.splice(candidateIndex, 1)[0]);
  }

  return result;
}

test("mulberry32 PRNG produces deterministic values for the same seed", () => {
  const rng1 = mulberry32(12345);
  const rng2 = mulberry32(12345);

  const values1 = [rng1(), rng1(), rng1()];
  const values2 = [rng2(), rng2(), rng2()];

  assert.deepEqual(values1, values2);
  assert.ok(values1.every((v) => v >= 0 && v < 1));
});

test("shuffleWithSeed preserves all items without duplication or loss", () => {
  const original = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const shuffled1 = shuffleWithSeed(original, 42);
  const shuffled2 = shuffleWithSeed(original, 42);

  assert.equal(shuffled1.length, original.length);
  assert.deepEqual(shuffled1, shuffled2); // Deterministic
  assert.deepEqual([...shuffled1].sort((a, b) => a - b), original);
});

test("alternateByProperty reduces consecutive property collisions", () => {
  const items = [
    { id: 1, subject: "Math" },
    { id: 2, subject: "Math" },
    { id: 3, subject: "Physics" },
    { id: 4, subject: "Chemistry" },
    { id: 5, subject: "Math" },
    { id: 6, subject: "Physics" },
  ];

  const alternated = alternateByProperty(items, (item) => item.subject, 999);

  assert.equal(alternated.length, items.length);

  // Check consecutive collisions count is reduced
  let collisionCount = 0;
  for (let i = 1; i < alternated.length; i++) {
    if (alternated[i].subject === alternated[i - 1].subject) {
      collisionCount++;
    }
  }

  assert.ok(collisionCount <= 1, `Expected <= 1 collision, got ${collisionCount}`);
});
