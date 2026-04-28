import { computed, ref, watch } from "vue";

import {
  clearGameSessionSnapshot,
  loadGlobalAchievements,
  loadGameSessionSnapshot,
  saveGlobalAchievements,
  saveGameSessionSnapshot
} from "../services/gameSessionStorage";
import demoFlowJson from "../scenario/demo-flow.json";
import type {
  DemoChoice,
  DemoFlow,
  InventoryItem,
  ScreenAchievement,
  StoryScreen
} from "../types/gameFlow";

const demoFlow = demoFlowJson as DemoFlow;
const targetAchievementsCount = 25;
const screenIds = new Set(demoFlow.screens.map((screen) => screen.id));
const removedAchievementIds = new Set(["ach-1", "ach-2"]);

const achievementLabels: Record<string, string> = {
  sleepyhead: "Śpioch",
  "notebook-swap": "Podmianka",
  "honest-courage": "Szczera odwaga",
  "adventure-calls": "Przygoda wzywa",
  "own-creativity": "Twórczość własna",
  "friendly-motivation": "Przyjazna motywacja",
  "older-friend": "Starsza przyjaciółka",
  "poetry-corner": "Kącik poetycki",
  "vanishing-mara": "Znikająca Mara",
  "creative-mara": "Twórcza Mara",
  "football-masters": "Mistrzowie piłki",
  "grandmaster-title": "Tytuł arcymistrzowski",
  "helpful-pack": "Pomocna paczka",
  "school-match": "Mecz o szkołę",
  checkmate: "Szach mat",
  "chochlik-friendship": "Przyjaźń z chochlikami",
  "green-listened": "Zieleń Wysłuchana",
  "maze-triumph": "Triumf w labiryncie",
  "the-answer-is-fire": "Odpowiedzią jest ogień",
  "trust-is-key": "Zaufanie to podstawa",
  "assertiveness-power": "Potęga asertywności",
  "green-school": "Zielona szkoła",
  "dream-team": "Drużyna marzeń",
  "trust-pays-off": "Zaufanie popłaca",
  "magic-word": "Magiczne słowo"
};

const achievementDescriptions: Record<string, string> = {
  sleepyhead: "Gdy wezwała cię Pani Woźna, ty wolałeś/aś pospać jeszcze 5 minut.",
  "notebook-swap": "Zeszyt Przeznaczenia został podmieniony.",
  "honest-courage": "Szczere postawienie sprawy podziałało, odzyskano Zeszyt Przeznaczenia.",
  "adventure-calls": "Drużyna ruszyła na przygodę!",
  "own-creativity": "Dokończono rysunek Sabiny.",
  "friendly-motivation": "Zachęcono Sabinę, by dokończyła rysunek.",
  "older-friend": "Sabina dołączyła do Drużyny.",
  "poetry-corner": "Po twoich zachętach Sabina odczytała swoje wiersze i przegoniła Marę ze szkoły.",
  "vanishing-mara": "Dzięki twojej kreatywności Mara zniknęła ze szkoły i wylądowała na bezludnej wyspie.",
  "creative-mara": "Dzięki tobie Mara Zniechęcenia odkryła potęgę kreatywności.",
  "football-masters": "Wygraliście mecz z licealistami!",
  "grandmaster-title": "Zagadka szachowa Wargina została rozwiązana!",
  "school-match": "Pokonaliście Chochliki w piłkę nożną.",
  checkmate: "Pokonaliście chochliki w szachy.",
  "helpful-pack": "Pomogliście krzatom w kopalni kredy.",
  "chochlik-friendship": "Rozmowa z chochlikami okazała się najlepszym wyjściem.",
  "green-listened": "Porozmawialiście ze szkolnymi roślinami.",
  "maze-triumph": "Rozszyfrowaliście plan szkoły.",
  "assertiveness-power": "Jasno postawiono granice.",
  "trust-is-key": "Baśka rozwiązała zagadkę Lasownika.",
  "the-answer-is-fire": "Rozwiązano zagadkę Lasownika.",
  "green-school": "Park został wysprzątany.",
  "dream-team": "Razem pokonaliście Żmija Zapomnienia.",
  "trust-pays-off": "Baśka pokonała Żmija Zapomnienia w pojedynku szermierczym.",
  "magic-word": "Negocjacje ze Żmijem się powiodły."
};

const inventoryItemLabels: Record<string, string> = {
  "universal-key": "Klucz uniwersalny",
  "destiny-notebook": "Zeszyt przeznaczenia",
  "magic-brush": "Magiczny Pędzel",
  "peacemaker-stick": "Kijek Przymierza",
  "legendary-yarn": "Legendarny Kłębek Włóczki",
  "fan-finger": "Cudowny Paluch Kibica"
};

const inventoryItemDescriptions: Record<string, string> = {
  "destiny-notebook": "Nowy artefakt trafia do twojego plecaka.",
  "magic-brush": "Magiczny pędzel trafia do twojego plecaka.",
  "legendary-yarn": "Legendarny Kłębek Włóczki trafia do twojego plecaka.",
  "fan-finger": "Cudowny Paluch Kibica trafia do twojego plecaka.",
  "universal-key": "Klucz Uniwersalny trafia do twojego plecaka.",
  "peacemaker-stick": "Kijek Przymierza trafia do twojego plecaka."
};

const starterInventory: InventoryItem[] = [
  { id: "empty-slot-1", label: "Puste miejsce", icon: "" },
  { id: "empty-slot-2", label: "Puste miejsce", icon: "" },
  { id: "empty-slot-3", label: "Puste miejsce", icon: "" }
];

const starterAchievements: ScreenAchievement[] = [];

function cloneInventoryItems(items: InventoryItem[]): InventoryItem[] {
  return items.map((item) => ({ ...item }));
}

function cloneAchievements(achievements: ScreenAchievement[]): ScreenAchievement[] {
  return achievements.map((achievement) => ({ ...achievement }));
}

function createEmptyInventorySlot(index: number): InventoryItem {
  return {
    id: `empty-slot-${index + 1}`,
    label: "Puste miejsce",
    icon: ""
  };
}

function createStarterInventory(): InventoryItem[] {
  return cloneInventoryItems(starterInventory);
}

function createStarterAchievements(): ScreenAchievement[] {
  return cloneAchievements(starterAchievements);
}

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
  const collectedItems = ref<InventoryItem[]>(createStarterInventory());
  const sessionUnlockedAchievements = ref<ScreenAchievement[]>(createStarterAchievements());
  const globalUnlockedAchievements = ref<ScreenAchievement[]>(createStarterAchievements());

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
  const visibleStoryChoices = computed(() =>
    storyScreen.value?.choices.filter((choice) => isChoiceVisible(choice)) ?? []
  );
  const visibleChoiceOverlays = computed(() =>
    storyScreen.value?.choiceOverlays?.filter((overlay) => getOverlayChoice(overlay.choiceId)) ?? []
  );
  const unlockedAchievements = computed(() => {
    const mergedAchievements = createStarterAchievements();

    for (const achievement of globalUnlockedAchievements.value) {
      if (!mergedAchievements.some((item) => item.id === achievement.id)) {
        mergedAchievements.push(achievement);
      }
    }

    for (const achievement of sessionUnlockedAchievements.value) {
      if (!mergedAchievements.some((item) => item.id === achievement.id)) {
        mergedAchievements.push(achievement);
      }
    }

    return mergedAchievements;
  });
  const totalAchievementsCount = computed(() => targetAchievementsCount);
  const remainingLockedAchievementsCount = computed(() =>
    Math.max(targetAchievementsCount - unlockedAchievements.value.length, 0)
  );
  const canGoBack = computed(() => navigationHistory.value.length > 1);

  function hasScreen(screenId: string | null | undefined): boolean {
    return !!screenId && screenIds.has(screenId);
  }

  function hasInventoryItem(itemId: string | null | undefined): boolean {
    return (
      !!itemId &&
      collectedItems.value.some(
        (inventoryItem) => inventoryItem.id === itemId && !!inventoryItem.icon
      )
    );
  }

  function hasAchievement(achievementId: string | null | undefined): boolean {
    return (
      !!achievementId &&
      sessionUnlockedAchievements.value.some((item) => item.id === achievementId)
    );
  }

  function isChoiceVisible(choice: DemoChoice): boolean {
    const passesItemRequirement =
      !choice.requiredItemId || hasInventoryItem(choice.requiredItemId);
    const passesAchievementRequirement =
      !choice.requiredAchievementId || hasAchievement(choice.requiredAchievementId);

    return passesItemRequirement && passesAchievementRequirement;
  }

  function normalizeAchievement(achievement: ScreenAchievement): ScreenAchievement {
    return {
      ...achievement,
    label: achievementLabels[achievement.id] ?? achievement.label,
      description:
        achievement.description ??
        achievementDescriptions[achievement.id] ??
        "Nowe osiągnięcie zostało odblokowane."
    };
  }

  function normalizeInventoryItem(item: InventoryItem): InventoryItem {
    return {
      ...item,
    label: inventoryItemLabels[item.id] ?? item.label,
      description:
        item.description ??
        inventoryItemDescriptions[item.id] ??
        "Dodaj nowy artefakt do plecaka."
    };
  }

  function normalizeStoredItems(items: InventoryItem[]): InventoryItem[] {
    if (!items.length) {
      return createStarterInventory();
    }

    const normalizedItems = items.map((item, index) =>
      item.icon
        ? normalizeInventoryItem(item)
        : {
            id: item.id || `empty-slot-${index + 1}`,
            label: item.label || "Puste miejsce",
            icon: ""
          }
    );

    while (normalizedItems.length < starterInventory.length) {
      normalizedItems.push(createEmptyInventorySlot(normalizedItems.length));
    }

    return normalizedItems;
  }

  function normalizeStoredAchievements(achievements: ScreenAchievement[]): ScreenAchievement[] {
    const normalizedAchievements = createStarterAchievements();

    for (const achievement of achievements) {
      if (removedAchievementIds.has(achievement.id)) {
        continue;
      }

      const normalizedAchievement = normalizeAchievement(achievement);
      const exists = normalizedAchievements.some((item) => item.id === normalizedAchievement.id);

      if (!exists) {
        normalizedAchievements.push(normalizedAchievement);
      }
    }

    return normalizedAchievements;
  }

  function sanitizeUnreadCount(value: number, maxValue: number): number {
    if (!Number.isFinite(value) || value < 0) {
      return 0;
    }

    return Math.min(Math.floor(value), Math.max(maxValue, 0));
  }

  function persistSession(): void {
    saveGameSessionSnapshot({
      currentScreenId: currentScreenId.value,
      navigationHistory: [...navigationHistory.value],
      playerName: playerName.value,
      playerGender: playerGender.value,
      collectedItems: cloneInventoryItems(collectedItems.value),
      unlockedAchievements: cloneAchievements(sessionUnlockedAchievements.value),
      unreadAchievementsCount: unreadAchievementsCount.value,
      unreadInventoryCount: unreadInventoryCount.value
    });
  }

  function hydrateSessionFromStorage(): void {
    globalUnlockedAchievements.value = normalizeStoredAchievements(loadGlobalAchievements());

    const snapshot = loadGameSessionSnapshot();

    if (!snapshot) {
      return;
    }

    const restoredScreenId = hasScreen(snapshot.currentScreenId)
      ? snapshot.currentScreenId
      : demoFlow.firstScreenId;
    const restoredHistory = snapshot.navigationHistory.filter((screenId) => hasScreen(screenId));

    currentScreenId.value = restoredScreenId;
    navigationHistory.value = restoredHistory.length ? restoredHistory : [restoredScreenId];

    if (navigationHistory.value.at(-1) !== restoredScreenId) {
      navigationHistory.value.push(restoredScreenId);
    }

    playerName.value = snapshot.playerName;
    playerGender.value = snapshot.playerGender === "female" ? "female" : "male";
    collectedItems.value = normalizeStoredItems(snapshot.collectedItems);
    sessionUnlockedAchievements.value = normalizeStoredAchievements(snapshot.unlockedAchievements);

    let shouldPersistGlobalAchievements = false;

    for (const achievement of sessionUnlockedAchievements.value) {
      if (!globalUnlockedAchievements.value.some((item) => item.id === achievement.id)) {
        globalUnlockedAchievements.value.push(achievement);
        shouldPersistGlobalAchievements = true;
      }
    }

    if (shouldPersistGlobalAchievements) {
      saveGlobalAchievements(cloneAchievements(globalUnlockedAchievements.value));
    }

    unreadAchievementsCount.value = sanitizeUnreadCount(
      snapshot.unreadAchievementsCount,
      sessionUnlockedAchievements.value.length
    );
    unreadInventoryCount.value = sanitizeUnreadCount(
      snapshot.unreadInventoryCount,
      collectedItems.value.filter((item) => !!item.icon).length
    );
    achievementToast.value = null;
    itemToast.value = null;
    itemLostToast.value = null;
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
      const exists = sessionUnlockedAchievements.value.find(
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

  function setCurrentScreen(
    screenId: string,
    options?: { pushHistory?: boolean; resetHistory?: boolean }
  ): boolean {
    if (!hasScreen(screenId)) {
      return false;
    }

    const targetScreen = demoFlow.screens.find((screen) => screen.id === screenId);

    currentScreenId.value = screenId;
    closeTransientUi();

    if (options?.pushHistory !== false) {
      const lastScreenId = navigationHistory.value.at(-1);
      if (lastScreenId !== screenId) {
        navigationHistory.value.push(screenId);
      }
    }

    if (options?.resetHistory) {
      navigationHistory.value = [screenId];
    } else if (targetScreen?.type === "story" && targetScreen.resetHistoryOnEnter) {
      navigationHistory.value = [screenId];
    }

    if (targetScreen?.type === "story") {
      applyScreenEntryEffects(targetScreen);
    }

    persistSession();

    return true;
  }

  function goToScreen(
    screenId: string,
    options?: { pushHistory?: boolean; resetHistory?: boolean }
  ): boolean {
    return setCurrentScreen(screenId, options);
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
      const unlockedAchievement = achievementToast.value;

      if (!sessionUnlockedAchievements.value.some((achievement) => achievement.id === unlockedAchievement.id)) {
        sessionUnlockedAchievements.value.push(unlockedAchievement);
        unreadAchievementsCount.value += 1;
      }

      if (!globalUnlockedAchievements.value.some((achievement) => achievement.id === unlockedAchievement.id)) {
        globalUnlockedAchievements.value.push(unlockedAchievement);
        saveGlobalAchievements(cloneAchievements(globalUnlockedAchievements.value));
      }
    }

    achievementToast.value = null;
    persistSession();
  }

  function saveItemToast(): void {
    if (itemToast.value) {
      addInventoryItem(itemToast.value);
      unreadInventoryCount.value += 1;
    }

    itemToast.value = null;
    persistSession();
  }

  function saveItemLostToast(): void {
    if (itemLostToast.value) {
      removeInventoryItem(itemLostToast.value.id);
    }

    itemLostToast.value = null;
    persistSession();
  }

  function resetSession(): void {
    currentScreenId.value = demoFlow.firstScreenId;
    navigationHistory.value = [demoFlow.firstScreenId];
    playerName.value = "";
    playerGender.value = "male";
    isInventoryOpen.value = false;
    isAchievementsOpen.value = false;
    isGrzeniaPopupOpen.value = false;
    achievementToast.value = null;
    itemToast.value = null;
    itemLostToast.value = null;
    unreadAchievementsCount.value = 0;
    unreadInventoryCount.value = 0;
    collectedItems.value = createStarterInventory();
    sessionUnlockedAchievements.value = createStarterAchievements();
    clearGameSessionSnapshot();
  }

  function startGame(): void {
    if (!introScreen.value || !playerName.value.trim()) {
      return;
    }

    goToScreen(introScreen.value.nextScreenId);
  }

  function clickStoryChoice(choice: DemoChoice): void {
    if (!isChoiceVisible(choice) || !hasScreen(choice.nextScreenId)) {
      return;
    }

    if (choice.itemLostOnSelect && hasInventoryItem(choice.itemLostOnSelect.id)) {
      removeInventoryItem(choice.itemLostOnSelect.id);
    }

    const shouldResetHistory =
      choice.resetHistoryOnSelect || storyScreen.value?.choicePresentation === "image-overlay";

    goToScreen(choice.nextScreenId!, { resetHistory: shouldResetHistory });
  }

  function getOverlayChoice(choiceId: string): DemoChoice | undefined {
    return visibleStoryChoices.value.find((item) => item.id === choiceId);
  }

  function clickOverlayChoice(choiceId: string): void {
    const choice = getOverlayChoice(choiceId);

    if (!choice) {
      return;
    }

    clickStoryChoice(choice);
  }

  hydrateSessionFromStorage();

  watch(
    currentScreenId,
    (screenId) => {
      console.log(`Jesteś na kroku: ${screenId}`);
    },
    { immediate: true }
  );

  watch([playerName, playerGender], () => {
    persistSession();
  });

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
    hasAchievement,
    hasScreen,
    hasInventoryItem,
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
    resetSession,
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
    visibleChoiceOverlays,
    visibleStoryChoices,
    usesImageOverlayChoices,
    welcomeScreen
  };
}
