export interface DemoChoice {
  id: string;
  label: string;
  nextScreenId: string | null;
}

export interface DemoPopup {
  target: string;
  title: string;
  body: string;
}

export interface ScreenHotspot {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ScreenPopupPosition {
  x: number;
  y: number;
}

export interface ChoiceOverlay {
  choiceId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  buttonX: number;
  buttonY: number;
}

export interface ScreenAchievement {
  id: string;
  label: string;
  icon: string;
  description?: string;
}

export interface InventoryItem {
  id: string;
  label: string;
  icon: string;
  locked?: boolean;
  description?: string;
}

export interface ScreenImageVariants {
  male?: string;
  female?: string;
}

export interface BaseScreen {
  id: string;
  type: "welcome" | "intro" | "story";
  title: string;
  subtitle: string;
}

export interface WelcomeScreen extends BaseScreen {
  type: "welcome";
  heading: string;
  description: string;
  image: string;
  primaryActionLabel: string;
  nextScreenId: string;
}

export interface IntroScreen extends BaseScreen {
  type: "intro";
  heading: string;
  nameLabel: string;
  namePlaceholder: string;
  genderLabel: string;
  genderOptions: Array<{ value: string; label: string }>;
  image: string;
  primaryActionLabel: string;
  nextScreenId: string;
}

export interface StoryScreen extends BaseScreen {
  type: "story";
  layout: string;
  image: string;
  imageVariants?: ScreenImageVariants;
  leftPanelWidth: number;
  rightPanelWidth: number;
  choicePresentation?: "bottom-bar" | "image-overlay";
  choiceOverlays?: ChoiceOverlay[];
  choices: DemoChoice[];
  infoPopup: DemoPopup;
  hotspot: ScreenHotspot;
  popupPosition: ScreenPopupPosition;
  itemOnEnter?: InventoryItem;
  itemLostOnEnter?: InventoryItem;
  achievementOnEnter?: ScreenAchievement;
  backScreenId: string;
}

export type DemoScreen = WelcomeScreen | IntroScreen | StoryScreen;

export interface DemoFlow {
  firstScreenId: string;
  screens: DemoScreen[];
}
