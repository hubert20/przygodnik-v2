import { computed, ref } from "vue";

import demoFlowJson from "../scenario/demo-flow.json";
import type {
  DemoChoice,
  DemoFlow,
  InventoryItem,
  ScreenAchievement,
  StoryScreen
} from "../types/gameFlow";

const demoFlow = demoFlowJson as DemoFlow;
const targetAchievementsCount = 15;
const screenIds = new Set(demoFlow.screens.map((screen) => screen.id));

const achievementDescriptions: Record<string, string> = {
  sleepyhead: "Gdy wezwała cię Pani Woźna, wolałeś lub wolałaś pospać jeszcze 5 minut.",
  "notebook-swap": "Zeszyt Przeznaczenia został podmieniony.",
  "honest-courage": "Szczere podejście pomogło odzyskać Zeszyt Przeznaczenia.",
  "ach-1": "Masz za sobą pierwszy ważny wybór.",
  "ach-2": "Rozpocząłeś lub rozpoczęłaś przygodę i ruszyłeś lub ruszyłaś dalej.",
  "older-friend": "Sabina dołączyła do Drużyny.",
  "friendly-motivation": "Zachęciłeś lub zachęciłaś Sabinę, by dokończyła rysunek.",
  "poetry-corner": "Po twoich zachętach Sabina odczytała swoje wiersze i przegoniła Marę ze szkoły.",
  "vanishing-mara": "Dzięki twojej kreatywności Mara zniknęła ze szkoły i wylądowała na bezludnej wyspie.",
  "creative-mara": "Dzięki tobie Mara Zniechęcenia odkryła potęgę kreatywności."
};

const inventoryItemDescriptions: Record<string, string> = {
  "destiny-notebook": "Nowy artefakt trafia do twojego plecaka.",
  "magic-brush": "Magiczny pędzel trafia do twojego plecaka."
};

const starterInventory: InventoryItem[] = [
  { id: "empty-slot-1", label: "Puste miejsce", icon: "" },
  { id: "empty-slot-2", label: "Puste miejsce", icon: "" },
  { id: "empty-slot-3", label: "Puste miejsce", icon: "" }
];

const starterAchievements: ScreenAchievement[] = [
  {
    id: "ach-1",
    label: "Pierwszy krok",
    icon: "\uD83C\uDF1F",
    description: "Masz za sobą pierwszy ważny wybór."
  },
  {
    id: "ach-2",
    label: "Dobry start",
    icon: "\uD83C\uDFC6",
    description: "Rozpocząłeś lub rozpoczęłaś przygodę i ruszyłeś lub ruszyłaś dalej."
  }
];

export function useGameSession() {
  const currentScreenId = ref(demoFlow.firstScreenId);
  const navigationHistory = ref([demoFlow.firstScreenId]);
  const playerName = ref("");
  const playerGender = ref("male");
  const isInventoryOpen = ref(false);
  const isAchievementsOpen = ref(false);
  const isGrzeniaPopupOpen = ref(false);
  const achievementToast = ref<ScreenAchievement | null>(null);
  const itemToast = ref<InventoryItem | null>(null);
  const itemLostToast = ref<InventoryItem | null>(null);
  const unreadAchievementsCount = ref(0);
  const unreadInventoryCount = ref(0);
  const collectedItems = ref<InventoryItem[]>([...starterInventory]);
  const unlockedAchievements = ref<ScreenAchievement[]>([...starterAchievements]);

  const currentScreen = computed(
    () =>
      demoFlow.screens.find((screen) => screen.id === currentScreenId.value) ??
      demoFlow.screens[0]
  );

  const welcomeScreen = computed(() =>
    currentScreen.value.type === "welcome" ? currentScreen.value : null
  );
  const introScreen = computed(() =>
    currentScreen.value.type === "intro" ? currentScreen.value : null
  );
  const storyScreen = computed(() =>
    currentScreen.value.type === "story" ? currentScreen.value : null
  );
  const showFrameHeader = computed(() => currentScreen.value.type !== "story");
  const usesImageOverlayChoices = computed(
    () => storyScreen.value?.choicePresentation === "image-overlay"
  );
  const totalAchievementsCount = computed(() => targetAchievementsCount);
  const remainingLockedAchievementsCount = computed(() =>
    Math.max(targetAchievementsCount - unlockedAchievements.value.length, 0)
  );
  const canGoBack = computed(() => navigationHistory.value.length > 1);

  function hasScreen(screenId: string | null | undefined): boolean {
    return !!screenId && screenIds.has(screenId);
  }

  function normalizeAchievement(achievement: ScreenAchievement): ScreenAchievement {
    return {
      ...achievement,
      description:
        achievement.description ??
        achievementDescriptions[achievement.id] ??
        "Nowe osiągnięcie zostało odblokowane."
    };
  }

  function normalizeInventoryItem(item: InventoryItem): InventoryItem {
    return {
      ...item,
      description:
        item.description ??
        inventoryItemDescriptions[item.id] ??
        "Dodaj nowy artefakt do plecaka."
    };
  }

  function addInventoryItem(item: InventoryItem): void {
    const exists = collectedItems.value.some((inventoryItem) => inventoryItem.id === item.id);

    if (exists) {
      return;
    }

    const emptySlotIndex = collectedItems.value.findIndex(
      (inventoryItem) => !inventoryItem.icon && inventoryItem.id.startsWith("empty-slot-")
    );

    if (emptySlotIndex >= 0) {
      collectedItems.value.splice(emptySlotIndex, 1, item);
      return;
    }

    collectedItems.value.push(item);
  }

  function removeInventoryItem(itemId: string): boolean {
    const itemIndex = collectedItems.value.findIndex((inventoryItem) => inventoryItem.id === itemId);

    if (itemIndex < 0) {
      return false;
    }

    collectedItems.value.splice(itemIndex, 1, {
      id: `empty-slot-${itemIndex + 1}`,
      label: "Puste miejsce",
      icon: ""
    });

    return true;
  }

  function applyScreenEntryEffects(targetScreen: StoryScreen): void {
    if (targetScreen.itemOnEnter) {
      const unlockedItem = normalizeInventoryItem(targetScreen.itemOnEnter);
      const exists =
        collectedItems.value.some((inventoryItem) => inventoryItem.id === unlockedItem.id) ||
        itemToast.value?.id === unlockedItem.id;

      if (!exists) {
        itemToast.value = unlockedItem;
      }
    }

    if (targetScreen.itemLostOnEnter) {
      const removedItem = normalizeInventoryItem(targetScreen.itemLostOnEnter);
      const existsInInventory = collectedItems.value.some((inventoryItem) => inventoryItem.id === removedItem.id);

      if (existsInInventory && itemLostToast.value?.id !== removedItem.id) {
        itemLostToast.value = removedItem;
      }
    }

    if (targetScreen.achievementOnEnter) {
      const unlockedAchievement = normalizeAchievement(targetScreen.achievementOnEnter);
      const exists = unlockedAchievements.value.find(
        (achievement) => achievement.id === unlockedAchievement.id
      );

      if (!exists && achievementToast.value?.id !== unlockedAchievement.id) {
        achievementToast.value = unlockedAchievement;
      }
    }
  }

  function closeTransientUi(): void {
    isInventoryOpen.value = false;
    isAchievementsOpen.value = false;
    isGrzeniaPopupOpen.value = false;
  }

  function setCurrentScreen(screenId: string, options?: { pushHistory?: boolean }): boolean {
    if (!hasScreen(screenId)) {
      return false;
    }

    currentScreenId.value = screenId;
    closeTransientUi();

    if (options?.pushHistory !== false) {
      const lastScreenId = navigationHistory.value.at(-1);
      if (lastScreenId !== screenId) {
        navigationHistory.value.push(screenId);
      }
    }

    const targetScreen = demoFlow.screens.find((screen) => screen.id === screenId);
    if (targetScreen?.type === "story") {
      applyScreenEntryEffects(targetScreen);
    }

    return true;
  }

  function goToScreen(screenId: string): boolean {
    return setCurrentScreen(screenId);
  }

  function goBack(): void {
    if (navigationHistory.value.length <= 1) {
      return;
    }

    navigationHistory.value.pop();

    while (navigationHistory.value.length > 0) {
      const previousScreenId = navigationHistory.value.at(-1);

      if (previousScreenId && hasScreen(previousScreenId)) {
        setCurrentScreen(previousScreenId, { pushHistory: false });
        return;
      }

      navigationHistory.value.pop();
    }
  }

  function toggleInventory(): void {
    isInventoryOpen.value = !isInventoryOpen.value;

    if (isInventoryOpen.value) {
      unreadInventoryCount.value = 0;
      isAchievementsOpen.value = false;
    }
  }

  function toggleAchievements(): void {
    isAchievementsOpen.value = !isAchievementsOpen.value;

    if (isAchievementsOpen.value) {
      unreadAchievementsCount.value = 0;
      isInventoryOpen.value = false;
    }
  }

  function closeInventory(): void {
    isInventoryOpen.value = false;
  }

  function closeAchievements(): void {
    isAchievementsOpen.value = false;
  }

  function closeAchievementToast(): void {
    achievementToast.value = null;
  }

  function closeItemToast(): void {
    itemToast.value = null;
  }

  function closeItemLostToast(): void {
    itemLostToast.value = null;
  }

  function saveAchievementToast(): void {
    if (achievementToast.value) {
      const exists = unlockedAchievements.value.some(
        (achievement) => achievement.id === achievementToast.value?.id
      );

      if (!exists) {
        unlockedAchievements.value.push(achievementToast.value);
        unreadAchievementsCount.value += 1;
      }
    }

    achievementToast.value = null;
  }

  function saveItemToast(): void {
    if (itemToast.value) {
      addInventoryItem(itemToast.value);
      unreadInventoryCount.value += 1;
    }

    itemToast.value = null;
  }

  function saveItemLostToast(): void {
    if (itemLostToast.value) {
      removeInventoryItem(itemLostToast.value.id);
    }

    itemLostToast.value = null;
  }

  function startGame(): void {
    if (!introScreen.value || !playerName.value.trim()) {
      return;
    }

    goToScreen(introScreen.value.nextScreenId);
  }

  function clickStoryChoice(choice: DemoChoice): void {
    if (!hasScreen(choice.nextScreenId)) {
      return;
    }

    goToScreen(choice.nextScreenId!);
  }

  function getOverlayChoice(choiceId: string): DemoChoice | undefined {
    return storyScreen.value?.choices.find((item) => item.id === choiceId);
  }

  function clickOverlayChoice(choiceId: string): void {
    const choice = getOverlayChoice(choiceId);

    if (!choice) {
      return;
    }

    clickStoryChoice(choice);
  }

  return {
    achievementToast,
    canGoBack,
    clickOverlayChoice,
    clickStoryChoice,
    closeAchievementToast,
    closeAchievements,
    closeInventory,
    closeItemLostToast,
    closeItemToast,
    collectedItems,
    currentScreen,
    currentScreenId,
    demoFlow,
    getOverlayChoice,
    hasScreen,
    goBack,
    goToScreen,
    introScreen,
    isAchievementsOpen,
    isGrzeniaPopupOpen,
    isInventoryOpen,
    itemLostToast,
    itemToast,
    playerGender,
    playerName,
    remainingLockedAchievementsCount,
    saveAchievementToast,
    saveItemLostToast,
    saveItemToast,
    showFrameHeader,
    startGame,
    storyScreen,
    toggleAchievements,
    toggleInventory,
    totalAchievementsCount,
    unreadAchievementsCount,
    unreadInventoryCount,
    unlockedAchievements,
    usesImageOverlayChoices,
    welcomeScreen
  };
}
