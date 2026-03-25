export interface StoryChoiceEffect {
  key: string;
  by: number;
}

export interface StoryChoice {
  id: string;
  label: string;
  nextSceneId: string;
  effects?: StoryChoiceEffect[];
}

export interface StoryScene {
  id: string;
  title: string;
  text: string;
  frameImage?: string;
  interactiveHint?: string;
  choices: StoryChoice[];
  endTag?: string;
}

export interface StoryEndingRule {
  key: string;
  minValue: number;
  endingSceneId: string;
}

export interface StoryDefinition {
  id: string;
  name: string;
  firstSceneId: string;
  scenes: StoryScene[];
  endingRules: StoryEndingRule[];
}

export interface StorySession {
  storyId: string;
  currentSceneId: string;
  variables: Record<string, number>;
  history: string[];
}
