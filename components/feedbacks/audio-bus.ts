// Module-level coordination so only one feedback voice note plays at a time.
// A player calls setActiveAudio(id) when it starts; every other player observes
// the change via useSyncExternalStore and pauses itself.

let activeId: string | null = null;
const listeners = new Set<() => void>();

export function setActiveAudio(id: string | null) {
  if (activeId === id) return;
  activeId = id;
  listeners.forEach((l) => l());
}

export function subscribeActiveAudio(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getActiveAudioId() {
  return activeId;
}
