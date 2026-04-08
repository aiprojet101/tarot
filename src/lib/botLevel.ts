export type BotLevelState = {
  level: 1 | 2 | 3;
  consecutiveWins: number;
};

const KEY = (mode: string) => `tarot_bot_level_${mode}`;

export function getBotLevel(mode: string = "solo"): BotLevelState {
  try {
    const raw = localStorage.getItem(KEY(mode));
    if (raw) {
      const parsed = JSON.parse(raw);
      return { level: parsed.level || 1, consecutiveWins: parsed.consecutiveWins || 0 };
    }
  } catch {}
  return { level: 1, consecutiveWins: 0 };
}

export function recordBotResult(mode: string = "solo", won: boolean): BotLevelState {
  const state = getBotLevel(mode);
  if (won) {
    state.consecutiveWins++;
    if (state.consecutiveWins >= 3 && state.level < 3) {
      state.level = (state.level + 1) as 1 | 2 | 3;
      state.consecutiveWins = 0;
    }
  } else {
    state.consecutiveWins = 0;
    if (state.level > 1) {
      state.level = (state.level - 1) as 1 | 2 | 3;
    }
  }
  localStorage.setItem(KEY(mode), JSON.stringify(state));
  return state;
}

export function resetBotLevel(mode: string = "solo"): void {
  localStorage.removeItem(KEY(mode));
}

export function botLevelLabel(level: 1 | 2 | 3): string {
  switch (level) {
    case 1: return "Debutant";
    case 2: return "Intermediaire";
    case 3: return "Expert";
  }
}
