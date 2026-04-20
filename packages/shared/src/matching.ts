export interface MatchingParticipant {
  id: string;
  availableSlotIds: string[];
}

export interface Matching {
  assignments: Record<string, string>; // participantId -> slotId
  unmatched: string[]; // participantIds not in assignments
}

export interface MatchingInput {
  participants: MatchingParticipant[];
  slotIds: string[];
  cap?: number;
}

export interface MatchingResult {
  maxSize: number;
  totalParticipants: number;
  matchings: Matching[];
  truncated: boolean;
}

/**
 * Bipartite matching: compute max matching size and enumerate up to cap distinct max matchings.
 * Scale assumption: participants <= 30, slots <= 50. cap defaults to 20.
 */
export function findMatchings(input: MatchingInput): MatchingResult {
  const participants = input.participants;
  const slotIds = input.slotIds;
  const cap = input.cap ?? 20;
  const N = participants.length;

  if (N === 0) {
    return { maxSize: 0, totalParticipants: 0, matchings: [], truncated: false };
  }

  // Pre-filter available slots to only those that exist on event
  const slotIdSet = new Set(slotIds);
  const availableByP: Set<string>[] = participants.map(
    (p) => new Set(p.availableSlotIds.filter((id) => slotIdSet.has(id)))
  );

  // 1) Compute max matching size via Hungarian-style augmenting-path DFS
  const maxSize = computeMaxMatchSize(N, availableByP);

  // Edge case: no slots → return single matching with everyone unmatched
  if (slotIds.length === 0) {
    return {
      maxSize: 0,
      totalParticipants: N,
      matchings: [{ assignments: {}, unmatched: participants.map((p) => p.id) }],
      truncated: false,
    };
  }

  // 2) Enumerate all matchings of size maxSize (up to cap)
  const results: Matching[] = [];
  const used = new Set<string>();
  const assignments: Record<string, string> = {};
  let truncated = false;

  function enumerate(idx: number, assignedCount: number): void {
    if (results.length >= cap) {
      truncated = true;
      return;
    }
    const remainingParticipants = N - idx;
    const needed = maxSize - assignedCount;
    // Pruning: remaining participants can't fill needed slots
    if (remainingParticipants < needed) return;

    if (idx === N) {
      if (assignedCount === maxSize) {
        const unmatched = participants.filter((p) => !(p.id in assignments)).map((p) => p.id);
        results.push({ assignments: { ...assignments }, unmatched });
      }
      return;
    }

    const p = participants[idx]!;
    const pSlots = availableByP[idx]!;

    // Option A: assign p to an available slot
    for (const slotId of pSlots) {
      if (used.has(slotId)) continue;
      used.add(slotId);
      assignments[p.id] = slotId;
      enumerate(idx + 1, assignedCount + 1);
      delete assignments[p.id];
      used.delete(slotId);
      if (results.length >= cap) {
        truncated = true;
        return;
      }
    }

    // Option B: leave p unmatched, proceed
    enumerate(idx + 1, assignedCount);
  }

  enumerate(0, 0);

  return {
    maxSize,
    totalParticipants: N,
    matchings: results,
    truncated,
  };
}

// Hungarian-style augmenting path DFS for max bipartite matching
function computeMaxMatchSize(N: number, availableByP: Set<string>[]): number {
  const slotToP = new Map<string, number>(); // slotId -> participant index
  let matched = 0;

  for (let i = 0; i < N; i++) {
    const visited = new Set<string>();
    if (tryAugment(i, availableByP, slotToP, visited)) matched++;
  }
  return matched;
}

function tryAugment(
  p: number,
  availableByP: Set<string>[],
  slotToP: Map<string, number>,
  visited: Set<string>
): boolean {
  for (const slotId of availableByP[p]!) {
    if (visited.has(slotId)) continue;
    visited.add(slotId);
    const owner = slotToP.get(slotId);
    if (owner === undefined || tryAugment(owner, availableByP, slotToP, visited)) {
      slotToP.set(slotId, p);
      return true;
    }
  }
  return false;
}
