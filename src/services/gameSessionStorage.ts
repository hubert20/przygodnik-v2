import type { GameSessionSnapshot } from "../types/gameFlow";

const STORAGE_KEY = "przygodnik-v2-game-session";
const STORAGE_VERSION = 1;

function canUseLocalStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function isStoredStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isStoredRecordArray(value: unknown): value is Array<Record<string, unknown>> {
  return Array.isArray(value) && value.every((item) => typeof item === "object" && item !== null);
}

export function loadGameSessionSnapshot(): GameSessionSnapshot | null {
  if (!canUseLocalStorage()) {
    return null;
  }

  try {
    const payload = window.localStorage.getItem(STORAGE_KEY);

    if (!payload) {
      return null;
    }

    const parsed = JSON.parse(payload) as Partial<GameSessionSnapshot>;

    if (
      parsed.version !== STORAGE_VERSION ||
      typeof parsed.currentScreenId !== "string" ||
      !isStoredStringArray(parsed.navigationHistory) ||
      typeof parsed.playerName !== "string" ||
      typeof parsed.playerGender !== "string" ||
      !isStoredRecordArray(parsed.collectedItems) ||
      !isStoredRecordArray(parsed.unlockedAchievements) ||
      typeof parsed.unreadAchievementsCount !== "number" ||
      typeof parsed.unreadInventoryCount !== "number"
    ) {
      return null;
    }

    return parsed as GameSessionSnapshot;
  } catch {
    return null;
  }
}

export function saveGameSessionSnapshot(
  snapshot: Omit<GameSessionSnapshot, "version">
): void {
  if (!canUseLocalStorage()) {
    return;
  }

  const payload: GameSessionSnapshot = {
    version: STORAGE_VERSION,
    ...snapshot
  };

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function clearGameSessionSnapshot(): void {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
}
