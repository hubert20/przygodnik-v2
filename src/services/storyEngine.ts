import type {
  StoryChoice,
  StoryDefinition,
  StoryScene,
  StorySession
} from "../types/story";

const STORAGE_KEY = "przygodnik-v1-session";

export class StoryEngine {
  private readonly sceneMap: Map<string, StoryScene>;

  constructor(private readonly story: StoryDefinition) {
    this.sceneMap = new Map(story.scenes.map((scene) => [scene.id, scene]));
  }

  public createSession(): StorySession {
    return {
      storyId: this.story.id,
      currentSceneId: this.story.firstSceneId,
      variables: {},
      history: [this.story.firstSceneId]
    };
  }

  public getCurrentScene(session: StorySession): StoryScene {
    const scene = this.sceneMap.get(session.currentSceneId);
    if (!scene) {
      throw new Error(`Nie znaleziono sceny: ${session.currentSceneId}`);
    }
    return scene;
  }

  public applyChoice(session: StorySession, choiceId: string): StorySession {
    const currentScene = this.getCurrentScene(session);
    const choice = currentScene.choices.find((item) => item.id === choiceId);

    if (!choice) {
      throw new Error(`Nie znaleziono wyboru: ${choiceId}`);
    }

    const nextVariables = this.applyEffects(session.variables, choice);
    let nextSceneId = choice.nextSceneId;

    // Rule-based ending override keeps content-driven endings simple in V1.
    if (nextSceneId === "ending_default") {
      const resolvedEnding = this.resolveEnding(nextVariables);
      if (resolvedEnding) {
        nextSceneId = resolvedEnding;
      }
    }

    return {
      ...session,
      currentSceneId: nextSceneId,
      variables: nextVariables,
      history: [...session.history, nextSceneId]
    };
  }

  public save(session: StorySession): void {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }

  public load(): StorySession | null {
    const payload = window.localStorage.getItem(STORAGE_KEY);
    if (!payload) {
      return null;
    }

    try {
      const parsed = JSON.parse(payload) as StorySession;
      if (parsed.storyId !== this.story.id) {
        return null;
      }
      if (!this.sceneMap.has(parsed.currentSceneId)) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  public clear(): void {
    window.localStorage.removeItem(STORAGE_KEY);
  }

  private applyEffects(
    variables: Record<string, number>,
    choice: StoryChoice
  ): Record<string, number> {
    const next = { ...variables };

    for (const effect of choice.effects ?? []) {
      next[effect.key] = (next[effect.key] ?? 0) + effect.by;
    }

    return next;
  }

  private resolveEnding(variables: Record<string, number>): string | null {
    for (const rule of this.story.endingRules) {
      const value = variables[rule.key] ?? 0;
      if (value >= rule.minValue) {
        return rule.endingSceneId;
      }
    }
    return null;
  }
}
