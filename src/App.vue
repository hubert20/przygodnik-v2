<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { CSSProperties } from "vue";

import { useGameSession } from "./composables/useGameSession";
import { loadGameSessionSnapshot } from "./services/gameSessionStorage";
import type { ChoiceOverlay, DemoChoice, GameSessionSnapshot, StoryScreen } from "./types/gameFlow";

declare global {
  interface Window {
    Goto?: (target: string | number) => void;
    CurrentScene?: () => string;
  }
}

const {
  achievementToast,
  canGoBack,
  clickOverlayChoice,
  clickStoryChoice,
  closeAchievements,
  closeInventory,
  collectedItems,
  currentScreen,
  getOverlayChoice,
  goBack,
  goToScreen,
  hasScreen,
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
} = useGameSession();

const isMenuOpen = ref(false);
const storyBaseWidth = 1280;
const storyBaseHeight = 660;
const endingSummaryScreenId = "ending-session-summary";
const viewportWidth = ref(typeof window === "undefined" ? 1440 : window.innerWidth);
const viewportHeight = ref(typeof window === "undefined" ? 900 : window.innerHeight);
const endingSessionSnapshot = ref<GameSessionSnapshot | null>(null);

const menuItems = ["O grze", "Jak grac", "Kontakt"];
const endingCreditsItems = ["Autorzy", "PM-owie", "Programiści", "Konsultanci"];
const endingLinksItems = [
  "Link do poprzedniej części",
  "Link do strony projektu",
  "Link do materiałów dodatkowych"
];
const endingPartnerItems = ["Sponsorzy", "Fundacja", "Partnerzy projektu"];
const endingCreatorEntries = [
  { role: "Scenariusz", name: "Tomasz Kowalski" },
  { role: "Programowanie", name: "Hubert Osipowicz" },
  { role: "Projekt UI", name: "Aleksandra Rudy" },
  { role: "Projekt graficzny", name: "Adam Kowalski" },
  { role: "Koordynacja", name: "Anna Łowczowska" },
  { role: "Wsparcie merytoryczne", name: "Julia Barszczewska" }
];
const isCompactViewport = computed(() => viewportWidth.value <= 1024);
const isMobileLandscapeViewport = computed(
  () => isCompactViewport.value && viewportWidth.value > viewportHeight.value
);
const isMobilePortraitViewport = computed(
  () => isCompactViewport.value && viewportHeight.value >= viewportWidth.value
);
const storyScale = computed(() => {
  const horizontalInset = viewportWidth.value <= 956 ? 12 : 32;
  const verticalInset = viewportHeight.value <= 500 ? 12 : 32;
  const availableWidth = Math.max(viewportWidth.value - horizontalInset, 320);
  const availableHeight = Math.max(viewportHeight.value - verticalInset, 240);

  return Math.min(1, availableWidth / storyBaseWidth, availableHeight / storyBaseHeight);
});
const storyViewportStyle = computed(() => ({
  width: `${Math.round(storyBaseWidth * storyScale.value)}px`,
  height: `${Math.round(storyBaseHeight * storyScale.value)}px`
}));
const storyWrapperStyle = computed(() => ({
  transform: `scale(${storyScale.value})`
}));
const usesCenteredOverlayLayout = computed(() => {
  const layout = storyScreen.value?.layout;

  return layout === "l016" || layout === "l018";
});
const handIconImage = computed(() => resolveImage("hand-icon.png"));
const backpackImage = computed(() => resolveImage("plecak.png"));
const partnerLogosImage = computed(() => resolveImage("tkmax-ap-logo.png"));
const uiButtonGreen1Bg = computed(() => `url('${resolveImage("button-style-3.png")}')`);
const uiPopupTextureBg = computed(() => `url('${resolveImage("popup.png")}')`);
const isInitialLoaderVisible = ref(true);
const hasInitialScreenLoaded = ref(false);
const isEndingSummaryScreen = computed(() => storyScreen.value?.id === endingSummaryScreenId);
const isWelcomeScreenActive = computed(() => !!welcomeScreen.value);
const isLandingScreen = computed(() => !!welcomeScreen.value || !!introScreen.value);
const usesHeroHeaderLayout = computed(() => isLandingScreen.value || isEndingSummaryScreen.value);
const shouldShowFrameHeader = computed(() => showFrameHeader.value || isEndingSummaryScreen.value);
const shouldShowResourceButtons = computed(() => {
  const currentStoryScreenId = storyScreen.value?.id;

  return currentStoryScreenId !== "s051" && currentStoryScreenId !== endingSummaryScreenId;
});
const visibleCollectedItems = computed(() => collectedItems.value.filter((item) => !!item.icon));
const visibleUnlockedAchievements = computed(() =>
  unlockedAchievements.value.filter((achievement) => !!achievement.icon)
);
const pendingChoiceConfirmation = ref<DemoChoice | null>(null);
const shouldShowBackButton = computed(() => {
  if (!canGoBack.value || !storyScreen.value) {
    return false;
  }

  if (visibleStoryChoices.value.length !== 1) {
    return false;
  }

  return !visibleStoryChoices.value[0]?.confirmationPopup;
});
const summaryPlayerName = computed(() => playerName.value.trim() || "Nie podano");
const summaryPlayerGenderLabel = computed(() =>
  playerGender.value === "female" ? "Dziewczynka" : "Chłopiec"
);
const endingFinaleHeroCopy = computed(() =>
  playerGender.value === "female"
    ? "Ukończyłaś przygodę! Jesteś prawdziwą bohaterką!"
    : "Ukończyłeś przygodę! Jesteś prawdziwym bohaterem!"
);
const endingAchievementSlots = computed(() => {
  const totalSlots = totalAchievementsCount.value;
  const unlockedWithIcons = unlockedAchievements.value
    .filter((achievement) => !!achievement.icon)
    .slice(0, totalSlots);

  return Array.from({ length: totalSlots }, (_, index) => {
    const unlockedAchievement = unlockedWithIcons[index];

    return {
      id: unlockedAchievement?.id ?? `locked-achievement-${index + 1}`,
      icon: unlockedAchievement?.icon || "🔑",
      label: unlockedAchievement?.label || "Nieodblokowane osiągnięcie",
      unlocked: !!unlockedAchievement
    };
  });
});
const summaryStoredScreenId = computed(
  () => endingSessionSnapshot.value?.currentScreenId ?? currentScreen.value.id
);
const activeChoiceConfirmation = computed(
  () => pendingChoiceConfirmation.value?.confirmationPopup ?? null
);
const hasPendingRewardToast = computed(
  () => !!itemToast.value || !!itemLostToast.value || !!achievementToast.value
);

function resolveImage(imageName: string): string {
  return `${import.meta.env.BASE_URL}images/${imageName}`;
}

function getStoryImageName(screen: StoryScreen): string {
  const variant = screen.imageVariants?.[playerGender.value as "male" | "female"];
  const mobileLandscapeVariant =
    playerGender.value === "female"
      ? screen.imageVariants?.mobileLandscapeFemale
      : screen.imageVariants?.mobileLandscapeMale;

  if (isMobileLandscapeViewport.value) {
    return mobileLandscapeVariant ?? screen.imageVariants?.mobileLandscape ?? variant ?? screen.image;
  }

  return variant ?? screen.image;
}

function getCurrentScreenImageName(): string | null {
  if (welcomeScreen.value) {
    return welcomeScreen.value.image;
  }

  if (introScreen.value) {
    return introScreen.value.image;
  }

  if (storyScreen.value) {
    return getStoryImageName(storyScreen.value);
  }

  return null;
}

function refreshEndingSessionSnapshot(): void {
  endingSessionSnapshot.value = loadGameSessionSnapshot();
}

async function preloadImage(src: string): Promise<void> {
  await new Promise<void>((resolve) => {
    const image = new Image();

    image.onload = () => resolve();
    image.onerror = () => resolve();
    image.src = src;
  });
}

function getOverlayAreaStyle(overlay: ChoiceOverlay, overlayIndex: number): CSSProperties {
  if (usesCenteredOverlayLayout.value && visibleChoiceOverlays.value.length) {
    const overlayCount = visibleChoiceOverlays.value.length;

    return {
      left: `calc(${overlayIndex} * (100% / ${overlayCount}))`,
      top: `${overlay.y}px`,
      width: `calc(100% / ${overlayCount})`,
      height: `${overlay.height}px`
    };
  }

  return {
    left: `${overlay.x}px`,
    top: `${overlay.y}px`,
    width: `${overlay.width}px`,
    height: `${overlay.height}px`
  };
}

function getOverlayChipStyle(overlay: ChoiceOverlay): CSSProperties {
  if (usesCenteredOverlayLayout.value) {
    return {};
  }

  return {
    transform: `translate(${overlay.buttonX}px, ${overlay.buttonY}px)`
  };
}

function updateViewport(): void {
  viewportWidth.value = window.innerWidth;
  viewportHeight.value = window.innerHeight;
}

function normalizeSceneId(target: string | number): string | null {
  if (typeof target === "number" && Number.isFinite(target)) {
    return `s${String(Math.trunc(target)).padStart(3, "0")}`;
  }

  if (typeof target !== "string") {
    return null;
  }

  const trimmedTarget = target.trim().toLowerCase();

  if (!trimmedTarget) {
    return null;
  }

  const numericMatch = trimmedTarget.match(/\d+/);

  if (!numericMatch) {
    return trimmedTarget.startsWith("s") ? trimmedTarget : null;
  }

  return `s${numericMatch[0].padStart(3, "0")}`;
}

function navigateToScreen(screenId: string): void {
  isMenuOpen.value = false;
  goToScreen(screenId);
}

function gotoFromConsole(target: string | number): void {
  const normalizedSceneId = normalizeSceneId(target);

  if (!normalizedSceneId) {
    console.warn(
      "[Goto] Niepoprawny parametr. Uzyj np. Goto(22), Goto('22') albo Goto('scene 22')."
    );
    return;
  }

  if (!hasScreen(normalizedSceneId)) {
    console.warn(`[Goto] Scena ${normalizedSceneId} nie istnieje.`);
    return;
  }

  navigateToScreen(normalizedSceneId);
  console.info(`[Goto] Przejscie do ${normalizedSceneId}.`);
}

function handleStartGame(): void {
  isMenuOpen.value = false;
  startGame();
}

function handleBack(): void {
  if (hasPendingRewardToast.value) {
    return;
  }

  isMenuOpen.value = false;
  goBack();
}

function handleRestartGame(): void {
  isMenuOpen.value = false;
  resetSession();

  if (typeof window !== "undefined") {
    window.location.reload();
  }
}

function openGameMenu(): void {
  isMenuOpen.value = true;
}

function toggleGameMenu(): void {
  isMenuOpen.value = !isMenuOpen.value;
}

function requestStoryChoice(choice: DemoChoice): void {
  if (hasPendingRewardToast.value) {
    return;
  }

  if (choice.confirmationPopup) {
    pendingChoiceConfirmation.value = choice;
    return;
  }

  clickStoryChoice(choice);
}

function requestOverlayChoice(choiceId: string): void {
  if (hasPendingRewardToast.value) {
    return;
  }

  const choice = getOverlayChoice(choiceId);

  if (!choice) {
    return;
  }

  requestStoryChoice(choice);
}

function confirmPendingChoice(): void {
  const choice = pendingChoiceConfirmation.value;

  pendingChoiceConfirmation.value = null;

  if (!choice || hasPendingRewardToast.value) {
    return;
  }

  clickStoryChoice(choice);
}

function cancelPendingChoice(): void {
  pendingChoiceConfirmation.value = null;
}

onMounted(() => {
  updateViewport();
  window.addEventListener("resize", updateViewport);
  window.Goto = gotoFromConsole;
  window.CurrentScene = () => currentScreen.value.id;
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", updateViewport);
  delete window.Goto;
  delete window.CurrentScene;
});

watch(
  () => currentScreen.value.id,
  async () => {
    pendingChoiceConfirmation.value = null;

    if (isEndingSummaryScreen.value) {
      refreshEndingSessionSnapshot();
    }

    if (hasInitialScreenLoaded.value) {
      return;
    }

    const imageName = getCurrentScreenImageName();

    if (!imageName) {
      hasInitialScreenLoaded.value = true;
      isInitialLoaderVisible.value = false;
      return;
    }

    await preloadImage(resolveImage(imageName));
    hasInitialScreenLoaded.value = true;
    isInitialLoaderVisible.value = false;
  },
  { immediate: true }
);
</script>

<template>
  <main class="page"
    :class="{
      'page--hero-surface': usesHeroHeaderLayout,
      'page--story-surface': !!storyScreen && !isEndingSummaryScreen,
      'page--welcome-surface': isWelcomeScreenActive
    }"
    :style="{ '--overlay-hand-icon': `url('${handIconImage}')` }">
    <div v-if="isInitialLoaderVisible" class="startup-loader">
      <div class="startup-loader-card">
        <div class="startup-loader-spinner" aria-hidden="true"></div>
        <strong>Gra uruchomi się za kilka sekund...</strong>
        <p>Ładujemy pierwszy ekran Przygodnika.</p>
      </div>
    </div>

    <div v-if="isMobilePortraitViewport" class="orientation-overlay" role="dialog" aria-modal="true">
      <div class="orientation-overlay-card">
        <strong>Obróć telefon poziomo</strong>
        <p>Gra działa najlepiej, gdy obrócisz telefon poziomo lub grasz na komputerze.</p>
      </div>
    </div>

    <button v-if="!usesHeroHeaderLayout" class="menu-toggle page-menu-toggle" @click.stop="toggleGameMenu"
      aria-label="Menu">
      <span></span>
      <span></span>
      <span></span>
    </button>

    <aside v-show="isMenuOpen" class="side-menu">
      <a v-for="item in menuItems" :key="item" href="#">{{ item }}</a>
      <button class="side-menu-action" type="button" @click="handleRestartGame">
        Restart gry
      </button>
    </aside>

    <section class="game-frame" :class="{
      'story-frame': !!storyScreen && !isEndingSummaryScreen,
      'game-frame--hero': usesHeroHeaderLayout,
      'game-frame--welcome': isWelcomeScreenActive
    }">
      <header v-if="shouldShowFrameHeader" class="game-header" :class="{
        'game-header--hero': usesHeroHeaderLayout,
        'game-header--welcome': isWelcomeScreenActive
      }">
        <div class="brand-block">
          <h1>{{ currentScreen.title }}</h1>
          <p>{{ currentScreen.subtitle }}</p>
        </div>
        <div class="logos">
          <img class="logos-image" :src="partnerLogosImage" alt="TK Maxx i Akademia Przyszlosci" />
        </div>
        <button v-if="usesHeroHeaderLayout" class="menu-toggle hero-menu-toggle" @click.stop="toggleGameMenu"
          aria-label="Menu">
          <span></span>
          <span></span>
          <span></span>
        </button>
      </header>

      <section v-if="welcomeScreen" class="screen-content framed-screen welcome-screen">
        <div class="welcome-layout">
          <div class="welcome-visual-stage" aria-hidden="true"></div>
          <div class="welcome-copy-panel">
            <div class="welcome-copy">
              <h2 v-html="welcomeScreen.heading"></h2>
              <p v-html="welcomeScreen.description"></p>
            </div>
            <button class="primary-cta" :disabled="!hasScreen(welcomeScreen.nextScreenId)"
              @click="navigateToScreen(welcomeScreen.nextScreenId)">
              {{ welcomeScreen.primaryActionLabel }}
            </button>
          </div>
        </div>
      </section>

      <section v-if="introScreen" class="screen-content framed-screen intro-screen">
        <div class="intro-layout">
          <div class="intro-form">
            <h2>{{ introScreen.heading }}</h2>

            <label class="field-label" for="player-name">
              {{ introScreen.nameLabel }}
            </label>
            <input id="player-name" v-model="playerName" class="text-input" :placeholder="introScreen.namePlaceholder"
              type="text" />

            <p class="field-label gender-label">{{ introScreen.genderLabel }}</p>
            <div class="gender-options">
              <label v-for="option in introScreen.genderOptions" :key="option.value" class="radio-option">
                <input v-model="playerGender" type="radio" :value="option.value" />
                <span>{{ option.label }}</span>
              </label>
            </div>
          </div>

          <img class="intro-image" :src="resolveImage(introScreen.image)" alt="Wybór protagonistki" />
        </div>
        <button class="primary-cta" :disabled="!playerName.trim() || !hasScreen(introScreen.nextScreenId)"
          @click="handleStartGame">
          {{ introScreen.primaryActionLabel }}
        </button>
      </section>

      <section v-if="isEndingSummaryScreen" class="screen-content framed-screen ending-finale-screen">
        <div class="ending-finale-layout">
          <div class="ending-finale-card">
            <h2>Gratulacje {{ summaryPlayerName }}!</h2>
            <p>{{ endingFinaleHeroCopy }}</p>
            <section class="ending-finale-achievements">
              <div class="ending-finale-achievements-layout">
                <div class="ending-finale-achievements-bag" aria-hidden="true">
                  <img :src="backpackImage" alt="" />
                </div>
                <div class="ending-finale-achievements-copy">
                  <h3>Odblokowane osiągnięcia</h3>
                  <strong>{{ visibleUnlockedAchievements.length }}/{{ totalAchievementsCount }}</strong>
                  <p>
                    Jeśli chcesz zdobyć wszystkie osiągnięcia, spróbuj przejść grę wybierając inną ścieżkę.
                  </p>
                </div>
                <div class="ending-finale-achievements-grid">
                  <span v-for="slot in endingAchievementSlots" :key="slot.id" class="ending-finale-achievement-slot"
                    :class="{ 'is-unlocked': slot.unlocked }" :title="slot.label" :aria-label="slot.label">
                    {{ slot.icon }}
                  </span>
                </div>
              </div>
            </section>
            <div class="ending-finale-actions">
              <button class="ending-finale-button ending-finale-button--primary" @click="handleRestartGame">
                Graj jeszcze raz!
              </button>
              <button class="ending-finale-button ending-finale-button--secondary" @click="openGameMenu">
                Menu gry
              </button>
            </div>
          </div>

          <section class="ending-creators">
            <h3>Twórcy</h3>
            <div class="ending-creators-grid">
              <article v-for="(entry, index) in endingCreatorEntries" :key="`${entry.role}-${index}`"
                class="ending-creator-entry">
                <span class="ending-creator-role">{{ entry.role }}</span>
                <span class="ending-creator-name">{{ entry.name }}</span>
              </article>
            </div>
          </section>

          <footer class="ending-finale-footer">© 2026 PRZYGODNIK - Wszystkie prawa zastrzeżone</footer>
        </div>

        <!-- Legacy ending summary panels kept for likely move to the pre-finale step.
        <div class="ending-summary-grid">
          <section class="ending-summary-panel">
            <h3>Gracz</h3>
            <dl class="ending-summary-list">
              <div>
                <dt>Imię</dt>
                <dd>{{ summaryPlayerName }}</dd>
              </div>
              <div>
                <dt>Postać</dt>
                <dd>{{ summaryPlayerGenderLabel }}</dd>
              </div>
              <div>
                <dt>Aktualny ekran</dt>
                <dd>{{ currentScreen.id }}</dd>
              </div>
              <div>
                <dt>Zapisany ekran</dt>
                <dd>{{ summaryStoredScreenId }}</dd>
              </div>
            </dl>
          </section>

          <section class="ending-summary-panel">
            <h3>Postęp</h3>
            <dl class="ending-summary-list">
              <div>
                <dt>Odblokowane osiągnięcia</dt>
                <dd class="ending-summary-stat-value">
                  <span>{{ visibleUnlockedAchievements.length }} / {{ totalAchievementsCount }}</span>
                </dd>
              </div>
              <div>
                <dt>Zablokowane osiągnięcia</dt>
                <dd>{{ remainingLockedAchievementsCount }}</dd>
              </div>
              <div>
                <dt>Artefakty w plecaku</dt>
                <dd class="ending-summary-stat-value">
                  <span>{{ visibleCollectedItems.length }}</span>
                </dd>
              </div>
              <div>
                <dt>Nieprzeczytane powiadomienia</dt>
                <dd>Osiągnięcia: {{ unreadAchievementsCount }}, plecak: {{ unreadInventoryCount }}</dd>
              </div>
            </dl>
          </section>

          <section class="ending-summary-panel">
            <h3>Osiągnięcia</h3>
            <ul v-if="visibleUnlockedAchievements.length" class="ending-summary-badges">
              <li v-for="achievement in visibleUnlockedAchievements" :key="achievement.id">
                <strong>{{ achievement.icon }} {{ achievement.label }}</strong>
                <span>{{ achievement.description || "Brak opisu." }}</span>
              </li>
            </ul>
          </section>

          <section class="ending-summary-panel">
            <h3>Artefakty</h3>
            <ul v-if="visibleCollectedItems.length" class="ending-summary-badges">
              <li v-for="item in visibleCollectedItems" :key="item.id">
                <strong>{{ item.icon }} {{ item.label }}</strong>
                <span>{{ item.description || "Brak opisu." }}</span>
              </li>
            </ul>
          </section>

          <section class="ending-summary-panel ending-summary-panel--wide">
            <h3>Zapis sesji</h3>
            <pre class="ending-summary-json">{{
              endingSessionSnapshot
                ? JSON.stringify(endingSessionSnapshot, null, 2)
                : "Brak danych zapisanych w localStorage."
            }}</pre>
          </section>
        </div>
        -->
      </section>

      <section v-else-if="storyScreen" class="screen-content story-screen">
        <div class="comic-stage" :style="storyViewportStyle">
          <Transition name="story-step" mode="out-in">
            <div class="story-step-shell" :key="currentScreen.id">
              <div class="comic-wrapper" :class="{ 'overlay-choice-scene': usesImageOverlayChoices }"
                :style="storyWrapperStyle">
                <img class="story-image" :src="resolveImage(getStoryImageName(storyScreen))"
                  :alt="`Scena ${storyScreen.id}`" />

                <button v-if="
                  storyScreen.hotspot.width > 0 &&
                  storyScreen.hotspot.height > 0 &&
                  (storyScreen.infoPopup.title || storyScreen.infoPopup.body)
                " class="grzenia-hotspot" :style="{
                  left: `${storyScreen.hotspot.x}px`,
                  top: `${storyScreen.hotspot.y}px`,
                  width: `${storyScreen.hotspot.width}px`,
                  height: `${storyScreen.hotspot.height}px`
                }" @click="isGrzeniaPopupOpen = !isGrzeniaPopupOpen" :aria-label="storyScreen.infoPopup.title
                  ? `Pokaż popup: ${storyScreen.infoPopup.title}`
                  : 'Pokaż popup'
                  " :title="storyScreen.infoPopup.title
                ? `Kliknij, aby otworzyć popup: ${storyScreen.infoPopup.title}`
                : 'Kliknij, aby otworzyć popup'
                " :aria-pressed="isGrzeniaPopupOpen"></button>

                <div v-if="
                  isGrzeniaPopupOpen &&
                  (storyScreen.infoPopup.title || storyScreen.infoPopup.body)
                " class="info-popup" :style="{
                  left: `${storyScreen.popupPosition.x}px`,
                  top: `${storyScreen.popupPosition.y}px`
                }">
                  <button class="popup-close" @click="isGrzeniaPopupOpen = false">&times;</button>
                  <strong>{{ storyScreen.infoPopup.title }}</strong>
                  <p>{{ storyScreen.infoPopup.body }}</p>
                </div>

                <div v-if="shouldShowResourceButtons" class="bottom-ui left">
                  <button class="icon-button backpack-button" @click="toggleInventory">
                    <img class="backpack-icon-image" :src="backpackImage" alt="Plecak" />
                    <span v-if="unreadInventoryCount > 0" class="notification-badge inventory-badge">
                      {{ unreadInventoryCount > 9 ? "9+" : unreadInventoryCount }}
                    </span>
                  </button>
                  <button class="icon-button trophy-button" @click="toggleAchievements"
                    aria-label="Pokaz nagrody za osiagniecia">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M8 4.5h8v2.25a4 4 0 0 1-8 0V4.5Z" fill="none" stroke="currentColor"
                        stroke-linejoin="round" stroke-width="1.8" />
                      <path d="M8 6H5.5a1 1 0 0 0-1 1c0 2.2 1.8 4 4 4h.5" fill="none" stroke="currentColor"
                        stroke-linejoin="round" stroke-width="1.8" />
                      <path d="M16 6h2.5a1 1 0 0 1 1 1c0 2.2-1.8 4-4 4H15" fill="none" stroke="currentColor"
                        stroke-linejoin="round" stroke-width="1.8" />
                      <path d="M12 10.75v3.75" fill="none" stroke="currentColor" stroke-linecap="round"
                        stroke-width="1.8" />
                      <path d="M9 19.5h6" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.8" />
                      <path d="M9.75 15.5h4.5v1.5a1 1 0 0 1-1 1h-2.5a1 1 0 0 1-1-1v-1.5Z" fill="none"
                        stroke="currentColor" stroke-linejoin="round" stroke-width="1.8" />
                    </svg>
                    <span v-if="unreadAchievementsCount > 0" class="notification-badge">
                      {{ unreadAchievementsCount > 9 ? "9+" : unreadAchievementsCount }}
                    </span>
                  </button>
                </div>

                <div class="bottom-ui right">
                  <button v-if="shouldShowBackButton" class="back-button"
                    :disabled="!canGoBack || hasPendingRewardToast" @click="handleBack">
                    <span class="back-button-arrow" aria-hidden="true">&larr;</span>
                    <span>Cofnij</span>
                  </button>
                  <template v-if="!usesImageOverlayChoices">
                    <button v-for="choice in visibleStoryChoices" :key="choice.id" class="button-rough-green-1"
                      :disabled="!hasScreen(choice.nextScreenId) || hasPendingRewardToast"
                      @click="requestStoryChoice(choice)">
                      {{ choice.label }}
                    </button>
                  </template>
                </div>

                <div v-if="usesImageOverlayChoices && visibleChoiceOverlays.length" class="choice-overlay-layer"
                  :class="{ 'choice-overlay-layer--centered': usesCenteredOverlayLayout }">
                  <button v-for="(overlay, overlayIndex) in visibleChoiceOverlays" :key="overlay.choiceId"
                    class="overlay-choice-button"
                    :class="{ 'overlay-choice-button--centered': usesCenteredOverlayLayout }"
                    :style="getOverlayAreaStyle(overlay, overlayIndex)"
                    :title="getOverlayChoice(overlay.choiceId)?.label ?? ''"
                    :aria-label="getOverlayChoice(overlay.choiceId)?.label ?? ''"
                    :disabled="!hasScreen(getOverlayChoice(overlay.choiceId)?.nextScreenId ?? null) || hasPendingRewardToast"
                    @click="requestOverlayChoice(overlay.choiceId)">
                    <span class="overlay-choice-hand" :style="{ backgroundImage: `url('${handIconImage}')` }"
                      aria-hidden="true"></span>
                  </button>
                </div>

                <aside class="inventory-panel" :class="{ open: isInventoryOpen }">
                  <div class="inventory-card">
                    <div class="overlay-panel-header inventory-header">
                      <strong>Plecak</strong>
                      <button class="panel-close-button" @click="closeInventory" aria-label="Zamknij plecak">
                        &times;
                      </button>
                    </div>
                    <div class="inventory-items">
                      <div v-for="item in collectedItems" :key="item.id" class="inventory-slot"
                        :class="{ locked: item.locked, empty: !item.icon }" :title="item.label">
                        <span v-if="item.icon" class="item-icon">{{ item.icon }}</span>
                      </div>
                    </div>
                  </div>
                </aside>

                <aside class="achievement-panel" :class="{ open: isAchievementsOpen }">
                  <div class="achievement-card">
                    <div class="overlay-panel-header achievement-header">
                      <strong>Osiagniecia</strong>
                      <button class="panel-close-button" @click="closeAchievements" aria-label="Zamknij osiagniecia">
                        &times;
                      </button>
                    </div>
                    <div class="achievement-progress">
                      <div class="achievement-progress-copy">
                        {{ unlockedAchievements.length }} / {{ totalAchievementsCount }}
                      </div>
                      <div class="achievement-progress-track">
                        <div class="achievement-progress-fill"
                          :style="{ width: `${(unlockedAchievements.length / totalAchievementsCount) * 100}%` }"></div>
                      </div>
                    </div>
                    <div class="achievement-list">
                      <article v-for="item in unlockedAchievements" :key="item.id" class="achievement-entry">
                        <div class="achievement-entry-icon">{{ item.icon }}</div>
                        <div class="achievement-entry-copy">
                          <strong>{{ item.label }}</strong>
                          <p>{{ item.description }}</p>
                        </div>
                        <div class="achievement-entry-mark">&#127942;</div>
                      </article>
                    </div>
                    <div class="achievement-locked-box">
                      <div class="achievement-locked-title">NIEODBLOCKOWANE OSIAGNIECIA</div>
                      <div class="achievement-locked-entry">
                        <div class="achievement-locked-icon">&#128274;</div>
                        <div>
                          <strong>Graj dalej by odblokowac</strong>
                          <p>Pozostalo {{ remainingLockedAchievementsCount }} osiagniec do odblokowania</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </aside>

                <div v-if="itemToast || itemLostToast || achievementToast" class="reward-stack-overlay">
                  <div class="reward-stack">
                    <div v-if="itemToast" class="achievement-toast item-toast">
                      <div class="achievement-toast-spark">&#10022;</div>
                      <h3>Zdobyto artefakt!</h3>
                      <span class="toast-icon item-toast-icon">{{ itemToast.icon }}</span>
                      <strong>{{ itemToast.label }}</strong>
                      <p>{{ itemToast.description }}</p>
                      <button class="toast-action button-rough-green-1" @click="saveItemToast">Dodaj do plecaka</button>
                    </div>

                    <div v-if="itemLostToast && !itemToast" class="achievement-toast item-lost-toast">
                      <div class="achievement-toast-spark">&#10022;</div>
                      <h3>Utrata artefaktu</h3>
                      <span class="toast-icon item-lost-toast-icon">{{ itemLostToast.icon }}</span>
                      <strong>{{ itemLostToast.label }}</strong>
                      <p>{{ itemLostToast.description }}</p>
                      <button class="toast-action button-rough-green-1" @click="saveItemLostToast">Akceptuję utratę</button>
                    </div>

                    <div v-if="achievementToast && !itemToast && !itemLostToast"
                      class="achievement-toast achievement-toast-card">
                      <div class="achievement-toast-spark">&#10022;</div>
                      <h3>Gratulacje!</h3>
                      <span class="toast-icon">{{ achievementToast.icon }}</span>
                      <strong>{{ achievementToast.label }}</strong>
                      <p>{{ achievementToast.description }}</p>
                      <button class="toast-action button-rough-green-1" @click="saveAchievementToast">Zapisz osiagniecie</button>
                    </div>
                  </div>
                </div>

                <div v-if="activeChoiceConfirmation" class="choice-confirmation-overlay" role="dialog" aria-modal="true"
                  :aria-labelledby="'choice-confirmation-title'">
                  <div class="choice-confirmation-card">
                    <div class="choice-confirmation-icon" aria-hidden="true">
                      {{ activeChoiceConfirmation.icon || "!" }}
                    </div>
                    <h3 id="choice-confirmation-title">{{ activeChoiceConfirmation.title }}</h3>
                    <p>{{ activeChoiceConfirmation.body }}</p>
                    <div class="choice-confirmation-actions">
                      <button class="choice-confirmation-button choice-confirmation-button--confirm button-rough-green-1"
                        @click="confirmPendingChoice">
                        {{ activeChoiceConfirmation.confirmLabel }}
                      </button>
                      <button class="choice-confirmation-button choice-confirmation-button--cancel"
                        @click="cancelPendingChoice">
                        {{ activeChoiceConfirmation.cancelLabel }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </section>
    </section>
  </main>
</template>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Asap:wght@400;500;600;700;800&display=swap");

:global(body) {
  margin: 0;
  font-family: "Asap", Arial, sans-serif;
  background: #fff;
  overflow-x: hidden;
  overflow-y: auto;
}

:global(*) {
  box-sizing: border-box;
}

.page {
  position: relative;
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 16px;
  overflow-x: hidden;
  overflow-y: hidden;
}

.page--hero-surface {
  width: 100%;
  padding: 0;
  display: block;
  overflow-y: auto;
  background: linear-gradient(-90deg, rgba(148, 200, 134, 1) 0%, rgba(200, 216, 130, 1) 50%, rgba(249, 230, 125, 1) 100%);
}

.page--welcome-surface {
  background: #2a843f;
}

.startup-loader {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: grid;
  place-items: center;
  background: rgba(255, 252, 245, 0.96);
}

.startup-loader-card {
  width: min(420px, calc(100vw - 40px));
  padding: 28px 24px;
  border: 3px solid #f0b764;
  border-radius: 24px;
  background: #fffdf8;
  box-shadow: 0 18px 36px rgba(82, 62, 17, 0.16);
  text-align: center;
}

.startup-loader-card strong {
  display: block;
  margin-bottom: 8px;
  color: #1d3b60;
  font-size: 24px;
}

.startup-loader-card p {
  margin: 0;
  color: #5d6d7a;
  font-size: 15px;
  line-height: 1.5;
}

.startup-loader-spinner {
  width: 52px;
  height: 52px;
  margin: 0 auto 16px;
  border: 5px solid rgba(240, 183, 100, 0.28);
  border-top-color: #eb8a3d;
  border-radius: 999px;
  animation: startup-spin 0.9s linear infinite;
}

@keyframes startup-spin {
  to {
    transform: rotate(360deg);
  }
}

.orientation-overlay {
  position: fixed;
  inset: 0;
  z-index: 95;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(255, 252, 245, 0.96);
}

.orientation-overlay-card {
  width: min(420px, calc(100vw - 40px));
  padding: 28px 24px;
  border: 3px solid #9ccf67;
  border-radius: 24px;
  background: #ffffff;
  box-shadow: 0 16px 34px rgba(51, 79, 104, 0.2);
  text-align: center;
}

.orientation-overlay-card strong {
  display: block;
  margin-bottom: 8px;
  color: #1d3b60;
  font-size: 24px;
}

.orientation-overlay-card p {
  margin: 0;
  color: #5d6d7a;
  font-size: 15px;
  line-height: 1.5;
}

.game-frame {
  position: relative;
  width: min(1280px, calc((100vh - 32px) * 16 / 9), calc(100vw - 32px));
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: linear-gradient(-90deg, rgba(148, 200, 134, 1) 0%, rgba(200, 216, 130, 1) 50%, rgba(249, 230, 125, 1) 100%);
}

.game-frame--hero {
  width: 100%;
  min-height: 100vh;
  aspect-ratio: auto;
  display: grid;
  grid-template-rows: auto 1fr;
  align-content: start;
  background: transparent;
}

.game-frame--welcome {
  position: relative;
  overflow: hidden;
  background: #2a843f;
}

.game-frame--welcome::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 0;
  width: 94%;
  height: 138%;
  background: #c1d82f;
  border-top-right-radius: 20vw 50%;
  border-bottom-right-radius: 20vw 50%;
  transform: translateY(-50%);
  z-index: 0;
}

.story-frame {
  width: min(1280px, calc((100vh - 32px) * 1280 / 660), calc(100vw - 32px));
  aspect-ratio: 1280 / 660;
  overflow: visible;
  background: #ffffff;
}

.game-header {
  position: relative;
  z-index: 10;
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: start;
  gap: 18px;
  padding: 22px 30px 16px;
  border-bottom: 2px solid #1d4959;
}

.game-header--hero {
  width: 100%;
  grid-template-columns: minmax(0, 1fr) 54px;
  align-items: center;
  padding: 22px 40px 16px;
}

.game-header--welcome {
  border-bottom: none;
  padding: 26px 48px 10px;
}

.brand-block h1 {
  margin: 0;
  font-size: clamp(34px, 3.6vw, 48px);
  line-height: 0.95;
  color: #1d4959;
  font-weight: 600;
}

.brand-block p {
  margin: 8px 0 0;
  font-size: 13px;
  color: #1d4959;
}

.logos {
  justify-self: center;
  display: flex;
  align-items: center;
  justify-content: center;
}

.game-header--hero .logos {
  position: absolute;
  left: 50%;
  top: 12px;
  transform: translateX(-50%);
  justify-self: auto;
}

.game-frame--welcome .brand-block h1,
.game-frame--welcome .brand-block p {
  color: #111111;
}

.logos-image {
  width: min(250px, 24vw);
  height: auto;
  display: block;
}

.hero-menu-toggle {
  justify-self: end;
  z-index: 1;
}

.menu-toggle {
  position: relative;
  isolation: isolate;
  width: 54px;
  height: 54px;
  padding: 0;
  border: none;
  background: transparent;
  display: grid;
  align-content: center;
  justify-items: center;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  filter: drop-shadow(0 2px 4px rgba(31, 78, 165, 0.18));
  transition: transform 0.18s ease, filter 0.18s ease;
}

.menu-toggle::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background-repeat: no-repeat;
  background-position: center;
  background-size: 100% 100%;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96' preserveAspectRatio='none'%3E%3Cpath d='M19 13C29 9 43 10 57 10C72 10 82 10 88 15C94 19 95 28 94 39C96 49 95 61 92 72C88 81 79 86 67 86C53 87 41 87 29 85C17 84 9 79 7 69C4 58 5 47 7 37C5 26 8 18 19 13Z' fill='%23ffffff' stroke='%232f67c7' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
}

.menu-toggle:hover {
  transform: translateY(-1px);
  filter: drop-shadow(0 3px 6px rgba(31, 78, 165, 0.2));
}

.menu-toggle:active {
  transform: translateY(1px);
  filter: drop-shadow(0 1px 3px rgba(31, 78, 165, 0.16));
}

.menu-toggle span {
  width: 22px;
  height: 4px;
  border-radius: 0;
  background-color: transparent;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 44 8' preserveAspectRatio='none'%3E%3Cpath d='M4 2.1C9 1.5 15 1.7 22 1.7C29 1.7 35 1.5 40 2.1C41.6 2.4 42.4 3.1 42.4 4C42.4 4.9 41.6 5.6 40 5.9C35 6.5 29 6.3 22 6.3C15 6.3 9 6.5 4 5.9C2.4 5.6 1.6 4.9 1.6 4C1.6 3.1 2.4 2.4 4 2.1Z' fill='%23558dee'/%3E%3Cpath d='M5 2.55C10 2 15.8 2.1 22 2.1C28.2 2.1 34 2 39 2.55' fill='none' stroke='rgba(255,255,255,0.38)' stroke-width='0.8' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: center;
  background-size: 100% 100%;
  box-shadow: none;
  margin: 2px 0;
}

.page-menu-toggle {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 50;
}

.side-menu {
  position: fixed;
  isolation: isolate;
  top: 84px;
  right: 20px;
  width: 220px;
  overflow: visible;
  background: transparent;
  border-radius: 0;
  filter: drop-shadow(0 10px 24px rgba(0, 0, 0, 0.14));
  pointer-events: auto;
  transform: translateY(0) scale(1);
  transform-origin: top right;
  transition: transform 0.18s ease, filter 0.18s ease;
  z-index: 48;
}

.side-menu::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background-repeat: no-repeat;
  background-position: center;
  background-size: 100% 100%;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 260 320' preserveAspectRatio='none'%3E%3Cpath d='M21 12C41 8 75 10 114 9C156 8 196 8 230 12C242 14 250 22 250 34C252 67 251 110 250 153C252 205 252 249 249 286C247 299 237 308 222 309C180 313 135 312 89 311C65 311 42 310 24 307C12 304 5 294 4 282C1 236 2 193 2 149C2 106 2 66 5 30C6 20 11 14 21 12Z' fill='rgba(255,255,255,0.96)' stroke='%23dfe7f3' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
}

.side-menu > * {
  position: relative;
  z-index: 1;
}

.side-menu a {
  display: block;
  padding: 15px 18px 8px 18px;
  color: #35506e;
  font-weight: 700;
  text-decoration: none;
  white-space: nowrap;
}

.side-menu-action {
  display: block;
  width: calc(100% - 24px);
  margin: 8px 12px 12px;
  padding: 12px 18px;
  border: 0;
  border-radius: 12px;
  background: #eef3f8;
  color: #35506e;
  font: inherit;
  font-weight: 700;
  text-align: left;
  white-space: nowrap;
  cursor: pointer;
}

.framed-screen {
  height: calc(100% - 94px);
  padding: 18px 28px 24px;
}

.screen-content {
  height: 100%;
}

.story-screen {
  display: grid;
  place-items: center;
  padding: 0;
  overflow: visible;
}

.welcome-screen,
.intro-screen,
.ending-finale-screen {
  display: grid;
  align-content: start;
  justify-items: center;
}

.welcome-screen {
  position: relative;
  z-index: 1;
  justify-items: stretch;
}

.game-frame--hero .framed-screen {
  width: 100%;
  height: auto;
  min-height: 0;
  padding: 18px 40px 24px;
}

.welcome-layout,
.intro-layout {
  width: 100%;
  max-width: 1000px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;
  gap: 24px;
  margin-top: 24px;
}

.welcome-layout {
  max-width: none;
  min-height: calc(100vh - 130px);
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: clamp(28px, 4vw, 56px);
  margin-top: 0;
}

.welcome-visual-stage {
  width: 100%;
  min-height: 100%;
}

.welcome-copy-panel {
  width: 100%;
  max-width: none;
  justify-self: stretch;
  display: grid;
  justify-items: start;
  gap: 22px;
  padding: clamp(20px, 5vh, 40px) 0 clamp(36px, 8vh, 64px);
}

.intro-image {
  width: 100%;
  max-width: 360px;
  justify-self: center;
  border-radius: 8px;
}

.welcome-copy h2,
.intro-form h2 {
  margin: 0 0 14px;
  color: #eb7034;
  font-size: 34px;
}

.welcome-copy h2,
.intro-form h2 {
  font-size: 24px;
}

.welcome-copy p {
  margin: 0;
  color: #1f2f20;
  line-height: 1.55;
  font-size: 18px;
  max-width: 430px;
}

.intro-form {
  width: 100%;
  max-width: 360px;
}

.field-label {
  display: block;
  margin: 0 0 10px;
  color: #eb7034;
  font-size: 15px;
  font-weight: 700;
}

.gender-label {
  margin-top: 18px;
}

.text-input {
  width: 100%;
  height: 48px;
  padding: 0 16px;
  border: 2px solid #f0b380;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.95);
  font-size: 16px;
}

.gender-options {
  display: flex;
  gap: 28px;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #eb7034;
  font-weight: 700;
}

.primary-cta {
  margin-top: 0;
  min-width: 280px;
  height: 64px;
  border: 2px solid #eea474;
  border-radius: 16px;
  background: #fff;
  color: #eb7034;
  font-size: 28px;
  font-weight: 900;
  box-shadow: 0 7px 16px rgba(222, 120, 48, 0.25);
  cursor: pointer;
}

.primary-cta:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.comic-stage {
  position: relative;
  display: block;
  overflow: visible;
}

.comic-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  width: 1280px;
  height: 660px;
  margin: 0;
  transform-origin: top left;
  will-change: transform;
}

.story-step-shell {
  position: absolute;
  inset: 0;
}

.story-step-enter-active,
.story-step-leave-active {
  transition:
    opacity 0.22s ease,
    transform 0.22s ease,
    filter 0.22s ease;
}

.story-step-enter-from {
  opacity: 0;
  transform: translateX(20px);
  filter: blur(5px);
}

.story-step-leave-to {
  opacity: 0;
  transform: translateX(-16px);
  filter: blur(5px);
}

.overlay-choice-scene .story-image {
  border-radius: 0;
}

.story-image {
  display: block;
  width: 1280px;
  height: 625px;
  object-fit: cover;
  border-radius: 6px;
}

.ending-finale-screen {
  padding-top: 12px;
}

.ending-finale-layout {
  width: 100%;
  max-width: 1100px;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.ending-finale-card {
  width: min(860px, 100%);
  padding: 26px 32px 28px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 16px 34px rgba(73, 89, 53, 0.28);
  text-align: center;
}

.ending-finale-card h2 {
  margin: 0 0 10px;
  color: #ef7b39;
  font-size: 34px;
  line-height: 1;
}

.ending-finale-card p {
  margin: 0 0 12px;
  color: #d37a3d;
  font-size: 18px;
  font-weight: 700;
}

.ending-finale-actions {
  display: grid;
  grid-template-columns: repeat(2, 300px);
  justify-content: center;
  gap: 18px;
}

.ending-finale-achievements {
  margin: 18px 0 20px;
  padding: 16px 14px;
  border: 1px solid rgba(240, 199, 105, 0.7);
  border-radius: 16px;
  background: rgba(255, 240, 181, 0.42);
}

.ending-finale-achievements-layout {
  display: grid;
  grid-template-columns: 92px minmax(180px, 1fr) minmax(200px, 240px);
  gap: 14px;
  align-items: center;
}

.ending-finale-achievements-bag {
  width: 84px;
  height: 84px;
  margin: 0 auto;
  border-radius: 16px;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.48);
}

.ending-finale-achievements-bag img {
  width: 62px;
  height: 62px;
  object-fit: contain;
}

.ending-finale-achievements-copy h3 {
  margin: 0;
  color: #5a6530;
  font-size: 18px;
  font-weight: 800;
}

.ending-finale-achievements-copy strong {
  display: block;
  margin-top: 4px;
  color: #cf6f2f;
  font-size: 30px;
  line-height: 1;
}

.ending-finale-achievements-copy p {
  margin: 10px 0 0;
  color: #6e6f52;
  font-size: 13px;
  line-height: 1.35;
  font-weight: 700;
  text-wrap: balance;
}

.ending-finale-achievements-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 8px;
}

.ending-finale-achievement-slot {
  width: 30px;
  height: 30px;
  border-radius: 9px;
  border: 1px solid rgba(103, 112, 121, 0.18);
  display: inline-grid;
  place-items: center;
  font-size: 16px;
  background: rgba(142, 153, 163, 0.12);
  color: rgba(95, 106, 116, 0.46);
  filter: grayscale(1);
  opacity: 0.7;
}

.ending-finale-achievement-slot.is-unlocked {
  background: radial-gradient(circle at 30% 30%, #fff6cd, #ffe17f);
  border-color: rgba(239, 183, 68, 0.6);
  color: #8c641c;
  box-shadow: 0 4px 10px rgba(236, 184, 71, 0.28);
  filter: none;
  opacity: 1;
}

.ending-finale-button {
  min-height: 58px;
  padding: 10px 24px;
  border-radius: 14px;
  font: inherit;
  font-size: 18px;
  font-weight: 800;
  line-height: 1.1;
  white-space: normal;
  cursor: pointer;
}

.ending-finale-button--primary {
  border: 2px solid #8dbd2f;
  background: #a6ce39;
  color: #ffffff;
  box-shadow:
    inset 0 0 0 2px #ffffff,
    inset 0 0 0 12px #a6ce39,
    0 8px 0 rgba(52, 86, 36, 0.26);
}

.ending-finale-button--secondary {
  border: 2px solid #6a88c5;
  background: #7d9bd7;
  color: #ffffff;
  box-shadow:
    inset 0 0 0 2px #ffffff,
    inset 0 0 0 12px #7d9bd7,
    0 8px 0 rgba(59, 85, 132, 0.3);
}

.ending-creators {
  width: min(860px, 100%);
  text-align: center;
}

.ending-creators h3 {
  margin: 0 0 14px;
  color: #ffffff;
  font-size: 30px;
  font-weight: 900;
  text-shadow: 0 4px 14px rgba(56, 88, 58, 0.22);
}

.ending-creators-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 18px;
}

.ending-creator-entry {
  display: grid;
  grid-template-columns: 170px minmax(0, 1fr);
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid #fff;
  background: linear-gradient(90deg, rgba(206, 221, 147, 0) 0%, rgba(255, 255, 255, 1) 100%);
}

.ending-creator-role,
.ending-creator-name {
  min-height: 40px;
  padding: 10px 14px;
  display: flex;
  align-items: center;
  font-size: 14px;
  font-weight: 600;
}

.ending-creator-role {
  color: #1D4959;
}

.ending-creator-name {
  color: #1D4959;
}

.ending-finale-footer {
  color: #1d4959;
  font-size: 15px;
  text-align: center;
}

.ending-summary-scene {
  width: 1280px;
  height: 625px;
  padding: 28px;
  display: flex;
  align-items: stretch;
  justify-content: center;
}

.ending-summary-card {
  width: 100%;
  max-width: 1080px;
  height: 100%;
  padding: 24px;
  border: 2px solid #f0b380;
  border-radius: 20px;
  background: rgba(255, 253, 248, 0.98);
  box-shadow: 0 16px 36px rgba(65, 83, 104, 0.18);
  color: #2f4a65;
  overflow-y: auto;
  overflow-x: hidden;
}

.ending-summary-card h2 {
  margin: 0 0 12px;
  color: #eb7034;
  font-size: 32px;
}

.ending-summary-card p {
  margin: 0 0 16px;
  line-height: 1.5;
}

.ending-summary-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.ending-summary-panel {
  padding: 18px;
  border: 1px solid #f3d4bc;
  border-radius: 16px;
  background: #fff;
}

.ending-summary-panel--wide {
  grid-column: 1 / -1;
}

.ending-summary-panel--finale {
  background: linear-gradient(180deg, #fffdf8 0%, #fff6ef 100%);
}

.ending-summary-panel h3 {
  margin: 0 0 14px;
  color: #eb7034;
  font-size: 20px;
}

.ending-summary-finale-copy {
  color: #2f4a65;
}

.ending-summary-placeholder-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.ending-summary-placeholder-card {
  min-height: 160px;
  padding: 16px;
  border: 2px dashed #f0b380;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.9);
}

.ending-summary-placeholder-card strong {
  display: block;
  margin-bottom: 12px;
  color: #eb7034;
  font-size: 18px;
}

.ending-summary-placeholder-card ul {
  margin: 0;
  padding-left: 18px;
  color: #2f4a65;
  line-height: 1.6;
}

.ending-summary-logo-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.ending-summary-logo-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 92px;
  min-height: 56px;
  padding: 8px 12px;
  border: 1px solid #f3d4bc;
  border-radius: 14px;
  background: #fff7f1;
  color: #6b7b8c;
  font-size: 13px;
  font-weight: 700;
  text-align: center;
}

.ending-summary-list {
  margin: 0;
}

.ending-summary-list div+div {
  margin-top: 10px;
}

.ending-summary-list dt {
  color: #6b7b8c;
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
}

.ending-summary-list dd {
  margin: 4px 0 0;
  font-size: 16px;
  font-weight: 700;
}

.ending-summary-stat-value {
  display: grid;
  gap: 8px;
}

.ending-summary-icon-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.ending-summary-mini-icon {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  display: inline-grid;
  place-items: center;
  font-size: 16px;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.92);
}

.ending-summary-mini-icon--achievement {
  background: radial-gradient(circle at 30% 30%, #fff1b0, #ffd861);
}

.ending-summary-mini-icon--item {
  background: radial-gradient(circle at 30% 30%, #d9ecff, #97c6f0);
}

.ending-summary-badges {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 12px;
}

.ending-summary-badges li {
  padding: 12px 14px;
  border-radius: 14px;
  background: #fff7f1;
  display: grid;
  gap: 4px;
}

.ending-summary-badges strong {
  color: #2f4a65;
}

.ending-summary-badges span {
  color: #6b7b8c;
  line-height: 1.4;
}

.ending-summary-empty {
  margin: 0;
  color: #6b7b8c;
}

.ending-summary-json {
  height: 280px;
  margin: 0;
  padding: 16px;
  border-radius: 14px;
  background: #1f2937;
  color: #f9fafb;
  font-size: 14px;
  line-height: 1.45;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-word;
}

@media (max-width: 1024px) {
  .ending-summary-placeholder-grid {
    grid-template-columns: 1fr;
  }
}

.grzenia-hotspot {
  position: absolute;
  left: 72px;
  top: 112px;
  width: 230px;
  height: 335px;
  z-index: 2;
  border: 0;
  border-radius: 20px;
  background: transparent;
  box-shadow: none;
  cursor: pointer;
  transition: transform 0.18s ease;
}

.grzenia-hotspot::before {
  content: none;
}

.grzenia-hotspot::after {
  content: "?";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 34px;
  height: 34px;
  border: 2px solid #ffffff;
  border-radius: 999px;
  background: #ffe382;
  box-shadow: 0 8px 16px rgba(46, 64, 86, 0.22);
  color: #2e4056;
  display: grid;
  place-items: center;
  font-size: 18px;
  font-weight: 900;
  line-height: 1;
  transform: translate(-50%, -50%);
  pointer-events: none;
  animation: hotspot-pulse 1.8s ease-in-out infinite;
}

.grzenia-hotspot:hover {
  transform: translateY(-2px);
}

.grzenia-hotspot[aria-pressed="true"] {
  background: transparent;
  box-shadow: none;
}

@keyframes hotspot-pulse {
  0% {
    transform: translate(-50%, -50%) scale(0.96);
    box-shadow: 0 0 0 0 rgba(255, 227, 130, 0.6);
  }

  70% {
    transform: translate(-50%, -50%) scale(1);
    box-shadow: 0 0 0 14px rgba(255, 227, 130, 0);
  }

  100% {
    transform: translate(-50%, -50%) scale(0.96);
    box-shadow: 0 0 0 0 rgba(255, 227, 130, 0);
  }
}

@keyframes overlay-hand-pulse {
  0% {
    transform: scale(0.92);
    filter: drop-shadow(0 6px 10px rgba(8, 20, 29, 0.24));
    opacity: 0.92;
  }

  50% {
    transform: scale(1);
    filter: drop-shadow(0 10px 18px rgba(8, 20, 29, 0.38));
    opacity: 1;
  }

  100% {
    transform: scale(0.92);
    filter: drop-shadow(0 6px 10px rgba(8, 20, 29, 0.24));
    opacity: 0.92;
  }
}

.info-popup {
  position: absolute;
  width: 255px;
  padding: 14px 16px;
  border: 2px solid #d9b548;
  border-radius: 14px;
  background: #ffe382;
  box-shadow:
    inset 0 0 0 2px #ffffff,
    inset 0 0 0 12px #ffe382,
    0 12px 26px rgba(28, 41, 59, 0.22);
  color: #2e4056;
}

.info-popup strong {
  display: block;
  margin-bottom: 6px;
}

.info-popup p {
  margin: 0;
  font-size: 16px;
  line-height: 1.3;
}

.popup-close {
  position: absolute;
  top: 6px;
  right: 8px;
  border: none;
  background: transparent;
  color: #6c7a8e;
  font-size: 18px;
  cursor: pointer;
}

.bottom-ui {
  position: absolute;
  display: flex;
  align-items: center;
  gap: 10px;
  z-index: 40;
}

.bottom-ui.left {
  left: 18px;
  bottom: 0;
}

.bottom-ui.right {
  right: 18px;
  bottom: 10px;
}

.icon-button {
  position: relative;
  isolation: isolate;
  width: 70px;
  height: 70px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: grid;
  place-items: center;
  appearance: none;
  -webkit-appearance: none;
  color: #6f88a3;
  filter: drop-shadow(0 4px 10px rgba(65, 83, 104, 0.18));
  transition: transform 0.18s ease, filter 0.18s ease;
}

.icon-button:hover {
  transform: translateY(-1px);
  filter: drop-shadow(0 6px 14px rgba(65, 83, 104, 0.24));
}

.icon-button::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background-repeat: no-repeat;
  background-position: center;
  background-size: 100% 100%;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96' preserveAspectRatio='none'%3E%3Cpath d='M20 13C30 9 43 10 57 10C70 10 80 10 87 14C93 18 95 27 94 39C96 50 95 61 92 73C88 82 79 87 67 87C53 88 42 88 29 86C18 85 10 80 7 71C4 60 4 49 6 38C5 27 8 18 20 13Z' fill='%23ffffff' stroke='%23c8d3e7' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
}

.icon-button > * {
  position: relative;
  z-index: 1;
}

.icon-button svg {
  width: 52px;
  height: 52px;
}

.backpack-icon-image {
  width: 52px;
  height: 52px;
  object-fit: contain;
}

.backpack-button {
  color: #7ca9cf;
  filter: drop-shadow(0 4px 10px rgba(80, 139, 212, 0.22));
}

.backpack-button::before {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96' preserveAspectRatio='none'%3E%3Cpath d='M20 13C30 9 43 10 57 10C70 10 80 10 87 14C93 18 95 27 94 39C96 50 95 61 92 73C88 82 79 87 67 87C53 88 42 88 29 86C18 85 10 80 7 71C4 60 4 49 6 38C5 27 8 18 20 13Z' fill='%23ffffff' stroke='%2367a4da' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
}

.trophy-button {
  color: #f08c2a;
  filter: drop-shadow(0 4px 10px rgba(240, 140, 42, 0.2));
}

.backpack-button:hover {
  filter: drop-shadow(0 6px 14px rgba(80, 139, 212, 0.3));
}

.trophy-button::before {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96' preserveAspectRatio='none'%3E%3Cpath d='M20 13C30 9 43 10 57 10C70 10 80 10 87 14C93 18 95 27 94 39C96 50 95 61 92 73C88 82 79 87 67 87C53 88 42 88 29 86C18 85 10 80 7 71C4 60 4 49 6 38C5 27 8 18 20 13Z' fill='%23ffffff' stroke='%23ff8b45' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
}

.trophy-button:hover {
  filter: drop-shadow(0 6px 14px rgba(240, 140, 42, 0.28));
}

.inventory-badge {
  background: #4f8dff;
}

.notification-badge {
  position: absolute;
  top: -10px;
  right: -10px;
  min-width: 30px;
  height: 30px;
  padding: 0 8px;
  border: 4px solid #fff;
  border-radius: 999px;
  background: #ff3d57;
  color: #fff;
  display: grid;
  place-items: center;
  font-size: 12px;
  font-weight: 900;
}

.back-button {
  position: relative;
  isolation: isolate;
  min-width: 86px;
  min-height: 64px;
  padding: 10px 18px 14px;
  border: none;
  background: transparent;
  color: #3a3936;
  font-weight: 600;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  cursor: pointer;
  line-height: 1;
  appearance: none;
  -webkit-appearance: none;
  filter: drop-shadow(0 4px 10px rgba(39, 36, 29, 0.16));
  transition: transform 0.18s ease, filter 0.18s ease;
}

.back-button::before,
.back-button::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-repeat: no-repeat;
  background-position: center;
  background-size: 100% 100%;
}

.back-button::before {
  content: none;
}

.back-button::after {
  z-index: -1;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 96' preserveAspectRatio='none'%3E%3Cpath d='M22 12C37 8 60 9 88 8C113 8 128 8 137 12C146 15 150 23 149 34C153 42 153 56 148 67C145 79 133 84 116 85C94 87 72 87 47 85C30 84 19 82 12 76C5 70 5 58 8 47C5 35 8 21 22 12Z' fill='%23fffdf8' stroke='%23979086' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
}

.back-button:hover {
  transform: translateY(-1px);
  filter: drop-shadow(0 6px 14px rgba(39, 36, 29, 0.6));
}

.back-button:active {
  transform: translateY(1px);
  filter: drop-shadow(0 2px 6px rgba(39, 36, 29, 0.14));
}

.back-button:disabled {
  opacity: 0.72;
  cursor: not-allowed;
  transform: none;
  filter: none;
}

.back-button span {
  font-size: 13px;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.back-button-arrow {
  font-size: 17px;
  line-height: 1;
}

.choice-button {
  min-width: 240px;
  min-height: 58px;
  padding: 10px 24px;
  border: 2px solid #8dbd2f;
  border-radius: 14px;
  background: #a6ce39;
  color: #ffffff;
  font-size: 18px;
  font-weight: 800;
  line-height: 1.1;
  white-space: normal;
  box-shadow:
    inset 0 0 0 2px #ffffff,
    inset 0 0 0 12px #a6ce39,
    0 8px 0 rgba(52, 86, 36, 0.26);
  cursor: pointer;
}

.choice-button:disabled {
  opacity: 0.72;
  cursor: not-allowed;
  box-shadow: none;
}

.choice-button:last-child {
  background: #a6ce39;
}

.button-rough-green-1 {
  position: relative;
  isolation: isolate;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 220px;
  max-width: 100%;
  min-height: 64px;
  padding: 16px 38px;
  border: none;
  background: transparent;
  color: #ffffff;
  font-family: inherit;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.15;
  text-align: center;
  white-space: normal;
  text-wrap: balance;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  text-shadow: 0 1px 0 rgba(82, 120, 23, 0.18);
  filter: drop-shadow(0 4px 10px rgba(80, 104, 25, 0.4));
  transition: transform 0.18s ease, filter 0.18s ease;
}

.button-rough-green-1::before,
.button-rough-green-1::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-repeat: no-repeat;
  background-position: center;
  background-size: 100% 100%;
}

.button-rough-green-1::before {
  z-index: -1;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 360 84' preserveAspectRatio='none'%3E%3Cpath d='M26 11C52 7 95 9 140 8C194 6 250 6 317 10C336 11 350 18 351 33C355 42 354 53 350 61C347 73 332 76 313 76C252 79 190 79 117 78C83 78 48 77 23 73C10 71 4 60 7 47C4 35 6 20 26 11Z' fill='%238dbd2f' stroke='%23ffffff' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
}

.button-rough-green-1::after {
  content: none;
}

.button-rough-green-1:hover {
  transform: translateY(-1px);
  filter: drop-shadow(0 6px 14px rgba(80, 104, 25, 0.5));
}

.button-rough-green-1:active {
  transform: translateY(1px);
  filter: drop-shadow(0 2px 6px rgba(80, 104, 25, 0.16));
}

.button-rough-green-1:disabled {
  opacity: 0.72;
  cursor: not-allowed;
  transform: none;
  filter: none;
}

.choice-overlay-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 12;
}

.overlay-choice-button {
  position: absolute;
  display: block;
  padding: 0;
  border: none;
  background: rgba(255, 255, 255, 0);
  box-shadow: none;
  cursor: pointer;
  pointer-events: auto;
  overflow: visible;
  transition:
    background 0.18s ease,
    box-shadow 0.18s ease;
}

.overlay-choice-hand {
  position: absolute;
  right: 10px;
  bottom: 10px;
  width: 60px;
  height: 60px;
  display: block;
  border: 2px solid #ffffff;
  border-radius: 999px;
  background-color: #f5cf49;
  box-shadow: 0 10px 20px rgba(46, 64, 86, 0.28);
  background-repeat: no-repeat;
  background-position: center;
  background-size: 40px 40px;
  pointer-events: none;
  transform-origin: center;
  animation: overlay-hand-pulse 1.15s ease-in-out infinite;
}

.overlay-choice-button:hover {
  background: rgba(133, 206, 230, 0.72);
  box-shadow:
    inset 0 0 0 2px rgba(255, 255, 255, 0.78),
    inset 0 0 0 10px rgba(133, 206, 230, 0.14);
}

.choice-overlay-layer--centered .overlay-choice-button--centered {
  border-radius: 0;
}


.overlay-choice-chip {
  min-width: 240px;
  min-height: 58px;
  max-width: 360px;
  padding: 10px 24px;
  border: 3px solid #2d2d2d;
  border-radius: 16px;
  background: #9fca7c;
  color: #161616;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.1;
  text-transform: uppercase;
  white-space: normal;
  box-shadow: 0 8px 0 rgba(52, 86, 36, 0.26);
}

.choice-overlay-layer--centered .overlay-choice-chip {
  transform: none !important;
}

.overlay-choice-button:disabled .overlay-choice-chip {
  opacity: 0.72;
  cursor: not-allowed;
  box-shadow: none;
}

.overlay-choice-button:disabled .overlay-choice-hand {
  opacity: 0.6;
  animation: none;
}

.overlay-choice-button:disabled:hover {
  background: transparent;
  box-shadow: none;
}

.inventory-panel {
  position: absolute;
  left: 18px;
  bottom: 94px;
  opacity: 0;
  pointer-events: none;
  transform: translateY(18px);
  transition: opacity 0.24s ease, transform 0.24s ease;
  z-index: 25;
}

.inventory-panel.open {
  opacity: 1;
  pointer-events: auto;
  transform: translateY(0);
}

.inventory-card {
  width: 330px;
  padding: 18px 18px 22px;
  border-radius: 18px;
  background: linear-gradient(180deg, #7db7ea 0%, #65a2d9 100%);
  box-shadow: 0 18px 30px rgba(74, 120, 168, 0.28);
  border: 2px solid rgba(255, 255, 255, 0.78);
}

.overlay-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
  color: #ffffff;
}

.overlay-panel-header strong {
  font-size: 18px;
  font-weight: 900;
}

.panel-close-button {
  border: none;
  background: transparent;
  color: inherit;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
  padding: 0;
}

.inventory-items {
  display: flex;
  gap: 24px;
  align-items: center;
}

.inventory-slot {
  width: 74px;
  height: 74px;
  border-radius: 18px;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.1);
  box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.1);
}

.inventory-slot.locked {
  opacity: 0.38;
}

.inventory-slot.empty {
  background: rgba(255, 255, 255, 0.06);
  box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.16);
}

.item-icon {
  font-size: 44px;
  filter: drop-shadow(0 4px 12px rgba(255, 230, 96, 0.45));
}

.achievement-panel {
  position: absolute;
  left: 18px;
  bottom: 94px;
  opacity: 0;
  pointer-events: none;
  transform: translateY(18px);
  transition: opacity 0.24s ease, transform 0.24s ease;
  z-index: 26;
}

.achievement-panel.open {
  opacity: 1;
  pointer-events: auto;
  transform: translateY(0);
}

.achievement-card {
  width: min(340px, calc(100vw - 56px));
  max-height: min(560px, calc(100vh - 170px));
  display: flex;
  flex-direction: column;
  padding: 18px;
  border-radius: 18px;
  background: linear-gradient(180deg, #ff8f48 0%, #ff7e39 100%);
  box-shadow: 0 20px 34px rgba(247, 132, 61, 0.32);
  border: 2px solid rgba(255, 255, 255, 0.75);
  overflow: hidden;
}

.achievement-progress {
  margin-bottom: 16px;
}

.achievement-progress-copy {
  margin-bottom: 8px;
  color: #fff9ea;
  font-size: 13px;
  font-weight: 800;
}

.achievement-progress-track {
  height: 20px;
  padding: 4px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.22);
  box-shadow: inset 0 2px 8px rgba(195, 91, 36, 0.25);
}

.achievement-progress-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #fff3aa 0%, #ffe17b 100%);
}

.achievement-list {
  display: grid;
  gap: 12px;
  margin-bottom: 16px;
  overflow-y: auto;
  min-height: 0;
  padding-right: 6px;
}

.achievement-entry {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 10px 20px rgba(219, 104, 42, 0.18);
}

.achievement-entry-icon {
  width: 48px;
  height: 48px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: radial-gradient(circle at 30% 30%, #fff2ad, #ffd861);
  font-size: 26px;
  flex-shrink: 0;
}

.achievement-entry-copy {
  min-width: 0;
}

.achievement-entry-copy strong {
  display: block;
  margin-bottom: 3px;
  color: #2e435e;
  font-size: 16px;
}

.achievement-entry-copy p {
  margin: 0;
  color: #7b8898;
  font-size: 12px;
  line-height: 1.3;
}

.achievement-entry-mark {
  margin-left: auto;
  color: #e58a43;
  font-size: 18px;
}

.achievement-locked-box {
  display: grid;
  gap: 10px;
  flex-shrink: 0;
}

.achievement-locked-title {
  color: #fff4e8;
  font-size: 12px;
  font-weight: 900;
}

.achievement-locked-entry {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.95);
  opacity: 0.88;
}

.achievement-locked-entry strong {
  display: block;
  margin-bottom: 3px;
  color: #6a7482;
  font-size: 15px;
}

.achievement-locked-entry p {
  margin: 0;
  color: #98a2af;
  font-size: 11px;
}

.achievement-locked-icon {
  width: 46px;
  height: 46px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: #eef1f5;
  font-size: 22px;
}

.reward-stack-overlay {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgba(160, 171, 92, 0.45);
  z-index: 35;
}

.reward-stack {
  position: relative;
  width: min(460px, calc(100% - 48px));
  height: min(540px, calc(100vh - 80px));
}

.achievement-toast {
  position: absolute;
  left: 0;
  width: 100%;
  padding: 32px 36px 28px;
  border-radius: 24px;
  background-color: transparent;
  background-image: v-bind(uiPopupTextureBg);
  background-size: 100% 100%;
  background-repeat: no-repeat;
  background-position: center;
  border: none;
  filter: drop-shadow(2px 4px 6px rgba(0, 0, 0, .2));
  text-align: center;
}

.item-toast {
  top: 0;
  z-index: 2;
}

.item-lost-toast {
  top: 0;
  z-index: 2;
}

.achievement-toast-card {
  top: 0;
  z-index: 2;
}

.toast-icon {
  width: 76px;
  height: 76px;
  margin: 0 auto 16px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: radial-gradient(circle at 30% 30%, #fff0a8, #ffd55a);
  font-size: 38px;
  box-shadow: 0 8px 18px rgba(255, 208, 74, 0.35);
}

.item-toast-icon {
  background: radial-gradient(circle at 30% 30%, #cfe6ff, #7fb3ea);
  box-shadow: 0 8px 18px rgba(125, 183, 234, 0.35);
}

.item-lost-toast-icon {
  background: radial-gradient(circle at 30% 30%, #ffd7d7, #f29a9a);
  box-shadow: 0 8px 18px rgba(242, 154, 154, 0.35);
}

.achievement-toast-close {
  position: absolute;
  top: 16px;
  right: 16px;
  color: #d19a4b;
}

.achievement-toast-spark {
  margin-bottom: 8px;
  color: #f08c3c;
  font-size: 28px;
}

.achievement-toast h3 {
  margin: 0 0 16px;
  color: #ef7b39;
  font-size: 24px;
}

.achievement-toast strong {
  display: block;
  margin-bottom: 8px;
  color: #24374f;
  font-size: 34px;
}

.achievement-toast p {
  margin: 0 auto 18px;
  max-width: 280px;
  color: #48607d;
  font-size: 17px;
  line-height: 1.35;
}

.toast-action {
  font: inherit;
  color: inherit;
  line-height: inherit;
  cursor: pointer;
  border: none;
  background: transparent;
}

.button-green-1 {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 300px;
  max-width: 100%;
  min-height: 64px;
  padding: 10px 20px;
  background-color: transparent;
  background-image: v-bind(uiButtonGreen1Bg);
  background-size: 100% 100%;
  background-repeat: no-repeat;
  background-position: center;
  box-shadow: none;
  appearance: none;
  -webkit-appearance: none;
  text-align: center;
  text-shadow: 0 1px 0 rgba(0, 0, 0, 0.12);
}

.choice-confirmation-overlay {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(38, 52, 70, 0.46);
  z-index: 36;
}

.choice-confirmation-card {
  width: min(520px, calc(100% - 24px));
  padding: 28px 28px 24px;
  border: 3px solid #ffd972;
  border-radius: 24px;
  background: #fffdf9;
  box-shadow: 0 22px 44px rgba(79, 63, 17, 0.24);
  text-align: center;
}

.choice-confirmation-icon {
  width: 76px;
  height: 76px;
  margin: 0 auto 16px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: radial-gradient(circle at 30% 30%, #fff0a8, #ffd55a);
  color: #24374f;
  font-size: 38px;
  font-weight: 900;
  box-shadow: 0 8px 18px rgba(255, 208, 74, 0.35);
}

.choice-confirmation-card h3 {
  margin: 0 0 12px;
  color: #ef7b39;
  font-size: 28px;
}

.choice-confirmation-card p {
  margin: 0 auto 20px;
  max-width: 360px;
  color: #48607d;
  font-size: 17px;
  line-height: 1.45;
  white-space: pre-line;
}

.choice-confirmation-actions {
  display: grid;
  gap: 12px;
  justify-items: center;
}

.choice-confirmation-button {
  min-height: 52px;
  border-radius: 999px;
  border: none;
  font: inherit;
  font-weight: 800;
  cursor: pointer;
}

.choice-confirmation-button--confirm {
  background: linear-gradient(180deg, #a8d88f 0%, #88c66d 100%);
  color: #ffffff;
  box-shadow: 0 10px 18px rgba(136, 198, 109, 0.35);
}

.choice-confirmation-button--confirm.button-rough-green-1 {
  width: auto;
  justify-self: center;
  background: transparent;
  box-shadow: none;
}

.toast-action.button-rough-green-1,
.choice-confirmation-button.button-rough-green-1 {
  min-height: 64px;
  padding: 16px 38px;
  color: #ffffff;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.15;
}

.choice-confirmation-button--cancel {
  background: #fff4ea;
  color: #48607d;
  box-shadow: inset 0 0 0 2px #f0caa8;
}

@media (max-width: 980px),
(max-height: 500px) {
  .page {
    padding: 6px;
  }

  .page--hero-surface {
    padding: 0;
  }

  .page-menu-toggle {
    top: 8px;
    right: 8px;
    width: 44px;
    height: 44px;
  }

  .menu-toggle span {
    width: 18px;
    background-color: #2F5E8E;
  }

  .side-menu {
    top: 58px;
    right: 8px;
  }

  .side-menu {
    width: min(220px, calc(100vw - 16px));
  }

  .game-frame {
    border-radius: 12px;
  }

  .game-frame--hero {
    min-height: 100vh;
    border-radius: 0;
  }

  .framed-screen {
    height: calc(100% - 72px);
    padding: 12px 16px 18px;
  }

  .game-frame--hero .framed-screen {
    height: auto;
    padding: 12px 16px 18px;
  }

  .game-header {
    gap: 12px;
    padding: 14px 16px 10px;
  }

  .game-header--hero {
    padding: 14px 16px 10px;
  }

  .brand-block h1 {
    font-size: clamp(24px, 4.2vw, 34px);
  }

  .brand-block p {
    margin-top: 4px;
    font-size: 11px;
  }

  .logos {
    align-self: center;
  }

  .logos-image {
    width: min(180px, 28vw);
  }

  .game-header--hero .logos {
    top: 14px;
  }

  .bottom-ui.left {
    left: 12px;
    bottom: -8px;
  }

  .bottom-ui.right {
    right: 12px;
    bottom: 2px;
  }

  .icon-button {
    width: 84px;
    height: 84px;
    border-radius: 16px;
  }

  .icon-button svg {
    width: 60px;
    height: 60px;
  }

  .backpack-icon-image {
    width: 60px;
    height: 60px;
  }

  .notification-badge {
    top: -8px;
    right: -8px;
    min-width: 34px;
    height: 34px;
    font-size: 13px;
  }

  .back-button {
    min-width: 88px;
    height: 66px;
    border-radius: 16px;
    gap: 8px;
    flex-direction: row;
  }

  .back-button span {
    font-size: 14px;
  }

  .back-button-arrow {
    font-size: 18px;
  }

  .info-popup {
    width: min(350px, calc(100vw - 24px));
  }

  .info-popup p {
    font-size: 20px;
    line-height: 1.5;
  }

  .grzenia-hotspot::after {
    width: 54px;
    height: 54px;
    font-size: 28px;
  }

  .choice-button {
    min-width: 280px;
    min-height: 70px;
    padding: 12px 24px;
    font-size: 23px;
  }

  .button-rough-green-1 {
    min-width: 320px;
    min-height: 74px;
    padding: 16px 34px;
    font-size: 22px;
    color: #232323;
    white-space: nowrap;
    text-shadow: 0 1px 0 rgba(255, 255, 255, 0.16);
  }

  .button-rough-green-1::before {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 360 84' preserveAspectRatio='none'%3E%3Cpath d='M26 11C52 7 95 9 140 8C194 6 250 6 317 10C336 11 350 18 351 33C355 42 354 53 350 61C347 73 332 76 313 76C252 79 190 79 117 78C83 78 48 77 23 73C10 71 4 60 7 47C4 35 6 20 26 11Z' fill='%23abe53a' stroke='%23ffffff' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  }

  .overlay-choice-hand {
    right: 8px;
    bottom: 8px;
    width: 82px;
    height: 82px;
    background-size: 45px;
  }

  .ending-finale-layout {
    gap: 18px;
  }

  .ending-finale-card {
    width: min(560px, 100%);
    padding: 22px 22px 24px;
  }

  .ending-finale-card h2 {
    font-size: 28px;
  }

  .ending-finale-card p {
    font-size: 16px;
  }

  .ending-finale-actions {
    gap: 12px;
  }

  .ending-finale-achievements {
    margin-top: 18px;
    padding: 14px 10px;
  }

  .ending-finale-achievements-layout {
    grid-template-columns: 1fr;
    justify-items: center;
    text-align: center;
  }

  .ending-finale-achievements-bag {
    width: 70px;
    height: 70px;
  }

  .ending-finale-achievements-bag img {
    width: 52px;
    height: 52px;
  }

  .ending-finale-achievements-copy h3 {
    font-size: 18px;
  }

  .ending-finale-achievements-copy strong {
    font-size: 26px;
  }

  .ending-finale-achievements-copy p {
    font-size: 12px;
  }

  .ending-finale-achievements-grid {
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 6px;
  }

  .ending-finale-achievement-slot {
    width: 26px;
    height: 26px;
    font-size: 14px;
  }

  .ending-finale-button {
    min-height: 46px;
    font-size: 16px;
  }

  .ending-creators h3 {
    font-size: 24px;
  }

  .ending-creators-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .ending-creator-entry {
    grid-template-columns: 140px minmax(0, 1fr);
  }

  .ending-creator-role,
  .ending-creator-name {
    min-height: 36px;
    padding: 8px 10px;
    font-size: 13px;
  }

  .ending-finale-footer {
    font-size: 13px;
  }

  .welcome-layout,
  .intro-layout {
    gap: 18px;
    margin-top: 8px;
  }

  .welcome-layout {
    min-height: calc(100vh - 100px);
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 12px;
    margin-top: 0;
  }

  .game-frame--welcome::before {
    top: 50%;
    left: 0;
    width: 92%;
    height: 138%;
    border-top-right-radius: 26vw 50%;
    border-bottom-right-radius: 26vw 50%;
    transform: translateY(-50%);
  }

  .welcome-copy-panel {
    width: 100%;
    gap: 14px;
    padding: 12px 0 28px;
  }

  .intro-image {
    max-width: 240px;
  }

  .welcome-copy h2,
  .intro-form h2 {
    margin-bottom: 10px;
    font-size: 24px;
  }

  .welcome-copy p {
    font-size: 14px;
    line-height: 1.45;
  }

  .field-label {
    margin-bottom: 6px;
    font-size: 13px;
  }

  .gender-label {
    margin-top: 12px;
  }

  .text-input {
    height: 42px;
    font-size: 14px;
  }

  .gender-options {
    gap: 18px;
  }

  .primary-cta {
    min-width: 200px;
    height: 44px;
    font-size: 18px;
  }

  .inventory-panel {
    left: 8px;
    bottom: 106px;
  }

  .inventory-card {
    width: min(380px, calc(100vw - 16px));
    padding: 18px 18px 20px;
    border-radius: 20px;
  }

  .overlay-panel-header {
    margin-bottom: 16px;
  }

  .overlay-panel-header strong {
    font-size: 20px;
  }

  .panel-close-button {
    font-size: 28px;
  }

  .inventory-items {
    gap: 18px;
    justify-content: space-between;
  }

  .inventory-slot {
    width: 78px;
    height: 78px;
    border-radius: 20px;
  }

  .item-icon {
    font-size: 46px;
  }

  .achievement-panel {
    left: 8px;
    top: 40px;
    bottom: 106px;
  }

  .achievement-card {
    width: min(830px, calc(100vw - 16px));
    height: 100%;
    max-height: none;
    padding: 18px;
    border-radius: 20px;
  }

  .achievement-list {
    flex: 1 1 auto;
    min-height: 260px;
    max-height: none;
    overflow-y: auto;
    padding-right: 4px;
  }

  .achievement-progress-copy {
    font-size: 14px;
  }

  .achievement-progress-track {
    height: 22px;
  }

  .achievement-entry {
    gap: 14px;
    padding: 12px;
  }

  .achievement-entry-icon {
    width: 50px;
    height: 50px;
    font-size: 26px;
  }

  .achievement-entry-copy strong {
    font-size: 22px;
  }

  .achievement-entry-copy p {
    font-size: 16px;
    line-height: 1.4;
  }

  .achievement-locked-title {
    font-size: 13px;
  }

  .achievement-locked-entry strong {
    font-size: 16px;
  }

  .achievement-locked-entry p {
    font-size: 12px;
    line-height: 1.4;
  }

  .reward-stack-overlay {
    padding: 14px;
  }

  .reward-stack {
    width: min(560px, calc(100vw - 28px));
    height: auto;
    display: grid;
    place-items: center;
  }

  .achievement-toast {
    position: relative;
    left: auto;
    width: min(560px, calc(100vw - 28px));
    max-width: 100%;
    min-height: auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 34px 30px 30px;
    border-radius: 24px;
  }

  .toast-icon {
    width: 104px;
    height: 104px;
    margin-bottom: 22px;
    font-size: 50px;
  }

  .achievement-toast-spark {
    margin-bottom: 14px;
    font-size: 40px;
  }

  .achievement-toast h3 {
    margin-bottom: 18px;
    font-size: 34px;
  }

  .achievement-toast strong {
    margin-bottom: 14px;
    font-size: 42px;
  }

  .achievement-toast p {
    max-width: 460px;
    margin: 0 auto 28px;
    font-size: 22px;
    line-height: 1.4;
  }

  .button-rough-green-1 {
    width: min(100%, 560px);
    min-width: 0;
  }

  .choice-confirmation-overlay {
    padding: 16px;
  }

  .choice-confirmation-card {
    width: min(620px, calc(100vw - 28px));
    padding: 34px 30px 28px;
    border-radius: 26px;
  }

  .choice-confirmation-icon {
    width: 92px;
    height: 92px;
    margin-bottom: 18px;
    font-size: 46px;
  }

  .choice-confirmation-card h3 {
    margin-bottom: 14px;
    font-size: 34px;
  }

  .choice-confirmation-card p {
    max-width: 440px;
    margin-bottom: 24px;
    font-size: 21px;
    line-height: 1.45;
  }

  .choice-confirmation-actions {
    gap: 14px;
  }

  .choice-confirmation-button {
    min-height: 60px;
    font-size: 18px;
  }

  .toast-action.button-rough-green-1,
  .choice-confirmation-button.button-rough-green-1 {
    min-height: 74px;
    padding: 16px 34px;
    font-size: 22px;
    line-height: 1.15;
  }

  .toast-action.button-rough-green-1 {
    width: auto;
    min-width: 220px;
    max-width: 100%;
    color: #232323;
    white-space: nowrap;
  }
}

@media (max-width: 980px) and (orientation: landscape),
(max-height: 500px) and (orientation: landscape) {
  .page--story-surface {
    height: 100dvh;
    min-height: 100dvh;
    overflow: hidden;
  }

  .story-frame {
    width: calc(100vw - 12px);
    overflow: hidden;
  }

  .story-screen {
    place-items: center;
    overflow: hidden;
  }

  .comic-stage {
    margin-top: 0;
  }

  .bottom-ui.left {
    bottom: -8px;
  }

  .bottom-ui.right {
    bottom: 2px;
  }
}
</style>
