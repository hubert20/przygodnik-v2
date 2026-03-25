<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { CSSProperties } from "vue";

import { useGameSession } from "./composables/useGameSession";
import type { ChoiceOverlay, StoryScreen } from "./types/gameFlow";

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
} = useGameSession();

const isMenuOpen = ref(false);
const storyBaseWidth = 1280;
const storyBaseHeight = 660;
const viewportWidth = ref(typeof window === "undefined" ? 1440 : window.innerWidth);
const viewportHeight = ref(typeof window === "undefined" ? 900 : window.innerHeight);

const menuItems = ["Start", "O grze", "Jak grac", "Kontakt"];
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

  return layout === "l016" || layout === "l017" || layout === "l018";
});
const backpackImage = computed(() => resolveImage("plecak.png"));
const isInitialLoaderVisible = ref(true);
const hasInitialScreenLoaded = ref(false);

function resolveImage(imageName: string): string {
  return `${import.meta.env.BASE_URL}images/${imageName}`;
}

function getStoryImageName(screen: StoryScreen): string {
  const variant = screen.imageVariants?.[playerGender.value as "male" | "female"];

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

async function preloadImage(src: string): Promise<void> {
  await new Promise<void>((resolve) => {
    const image = new Image();

    image.onload = () => resolve();
    image.onerror = () => resolve();
    image.src = src;
  });
}

function getOverlayAreaStyle(overlay: ChoiceOverlay): CSSProperties {
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

function navigateToScreen(screenId: string): void {
  isMenuOpen.value = false;
  goToScreen(screenId);
}

function handleStartGame(): void {
  isMenuOpen.value = false;
  startGame();
}

function handleBack(): void {
  isMenuOpen.value = false;
  goBack();
}

onMounted(() => {
  updateViewport();
  window.addEventListener("resize", updateViewport);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", updateViewport);
});

watch(
  () => currentScreen.value.id,
  async () => {
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
  <main class="page">
    <div v-if="isInitialLoaderVisible" class="startup-loader">
      <div class="startup-loader-card">
        <div class="startup-loader-spinner" aria-hidden="true"></div>
        <strong>Gra uruchomi się za kilka sekund...</strong>
        <p>Ładujemy pierwszy ekran Przygodnika.</p>
      </div>
    </div>

    <button class="menu-toggle page-menu-toggle" @click="isMenuOpen = !isMenuOpen" aria-label="Menu">
      <span></span>
      <span></span>
      <span></span>
    </button>

    <aside class="side-menu" :class="{ open: isMenuOpen }">
      <a v-for="item in menuItems" :key="item" href="#">{{ item }}</a>
    </aside>

    <section class="game-frame" :class="{ 'story-frame': !!storyScreen }">
      <header v-if="showFrameHeader" class="game-header">
        <div class="brand-block">
          <h1>{{ currentScreen.title }}</h1>
          <p>{{ currentScreen.subtitle }}</p>
        </div>
        <div class="logos">TK Maxx & Akademia Przyszlosci</div>
      </header>

      <section v-if="welcomeScreen" class="screen-content framed-screen welcome-screen">
        <div class="welcome-layout">
          <img
            class="welcome-image"
            :src="resolveImage(welcomeScreen.image)"
            alt="Ekran powitalny Przygodnika"
          />
          <div class="welcome-copy">
            <h2>{{ welcomeScreen.heading }}</h2>
            <p>{{ welcomeScreen.description }}</p>
          </div>
        </div>
        <button
          class="primary-cta"
          :disabled="!hasScreen(welcomeScreen.nextScreenId)"
          @click="navigateToScreen(welcomeScreen.nextScreenId)"
        >
          {{ welcomeScreen.primaryActionLabel }}
        </button>
      </section>

      <section v-if="introScreen" class="screen-content framed-screen intro-screen">
        <div class="intro-layout">
          <div class="intro-form">
            <h2>{{ introScreen.heading }}</h2>

            <label class="field-label" for="player-name">
              {{ introScreen.nameLabel }}
            </label>
            <input
              id="player-name"
              v-model="playerName"
              class="text-input"
              :placeholder="introScreen.namePlaceholder"
              type="text"
            />

            <p class="field-label gender-label">{{ introScreen.genderLabel }}</p>
            <div class="gender-options">
              <label
                v-for="option in introScreen.genderOptions"
                :key="option.value"
                class="radio-option"
              >
                <input v-model="playerGender" type="radio" :value="option.value" />
                <span>{{ option.label }}</span>
              </label>
            </div>
          </div>

          <img
            class="intro-image"
            :src="resolveImage(introScreen.image)"
            alt="Wybór protagonistki"
          />
        </div>
        <button
          class="primary-cta"
          :disabled="!playerName.trim() || !hasScreen(introScreen.nextScreenId)"
          @click="handleStartGame"
        >
          {{ introScreen.primaryActionLabel }}
        </button>
      </section>

      <section v-if="storyScreen" class="screen-content story-screen">
        <div class="comic-stage" :style="storyViewportStyle">
        <div
          class="comic-wrapper"
          :class="{ 'overlay-choice-scene': usesImageOverlayChoices }"
          :style="storyWrapperStyle"
        >
          <img
            class="story-image"
            :src="resolveImage(getStoryImageName(storyScreen))"
            :alt="`Scena ${storyScreen.id}`"
          />

          <button
            class="grzenia-hotspot"
            :style="{
              left: `${storyScreen.hotspot.x}px`,
              top: `${storyScreen.hotspot.y}px`,
              width: `${storyScreen.hotspot.width}px`,
              height: `${storyScreen.hotspot.height}px`
            }"
            @click="isGrzeniaPopupOpen = !isGrzeniaPopupOpen"
            aria-label="Informacja o Grzeni"
          ></button>

          <div
            v-if="isGrzeniaPopupOpen"
            class="info-popup"
            :style="{
              left: `${storyScreen.popupPosition.x}px`,
              top: `${storyScreen.popupPosition.y}px`
            }"
          >
            <button class="popup-close" @click="isGrzeniaPopupOpen = false">&times;</button>
            <strong>{{ storyScreen.infoPopup.title }}</strong>
            <p>{{ storyScreen.infoPopup.body }}</p>
          </div>

          <div class="bottom-ui left">
            <button class="icon-button backpack-button" @click="toggleInventory">
              <img
                class="backpack-icon-image"
                :src="backpackImage"
                alt="Plecak"
              />
              <span v-if="unreadInventoryCount > 0" class="notification-badge inventory-badge">
                {{ unreadInventoryCount > 9 ? "9+" : unreadInventoryCount }}
              </span>
            </button>
            <button
              class="icon-button trophy-button"
              @click="toggleAchievements"
              aria-label="Pokaz nagrody za osiagniecia"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M8 4.5h8v2.25a4 4 0 0 1-8 0V4.5Z"
                  fill="none"
                  stroke="currentColor"
                  stroke-linejoin="round"
                  stroke-width="1.8"
                />
                <path
                  d="M8 6H5.5a1 1 0 0 0-1 1c0 2.2 1.8 4 4 4h.5"
                  fill="none"
                  stroke="currentColor"
                  stroke-linejoin="round"
                  stroke-width="1.8"
                />
                <path
                  d="M16 6h2.5a1 1 0 0 1 1 1c0 2.2-1.8 4-4 4H15"
                  fill="none"
                  stroke="currentColor"
                  stroke-linejoin="round"
                  stroke-width="1.8"
                />
                <path
                  d="M12 10.75v3.75"
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-width="1.8"
                />
                <path
                  d="M9 19.5h6"
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-width="1.8"
                />
                <path
                  d="M9.75 15.5h4.5v1.5a1 1 0 0 1-1 1h-2.5a1 1 0 0 1-1-1v-1.5Z"
                  fill="none"
                  stroke="currentColor"
                  stroke-linejoin="round"
                  stroke-width="1.8"
                />
              </svg>
              <span v-if="unreadAchievementsCount > 0" class="notification-badge">
                {{ unreadAchievementsCount > 9 ? "9+" : unreadAchievementsCount }}
              </span>
            </button>
          </div>

          <div class="bottom-ui right">
            <button class="back-button" :disabled="!canGoBack" @click="handleBack">
              &larr;
              <span>Cofnij</span>
            </button>
            <template v-if="!usesImageOverlayChoices">
            <button
              v-for="choice in storyScreen.choices"
              :key="choice.id"
              class="choice-button"
              :disabled="!hasScreen(choice.nextScreenId)"
              @click="clickStoryChoice(choice)"
            >
              {{ choice.label }}
            </button>
            </template>
          </div>

          <div
            v-if="usesImageOverlayChoices && storyScreen.choiceOverlays"
            class="choice-overlay-layer"
            :class="{ 'choice-overlay-layer--centered': usesCenteredOverlayLayout }"
          >
            <button
              v-for="overlay in storyScreen.choiceOverlays"
              :key="overlay.choiceId"
              class="overlay-choice-button"
              :class="{ 'overlay-choice-button--centered': usesCenteredOverlayLayout }"
              :style="getOverlayAreaStyle(overlay)"
              :disabled="!hasScreen(getOverlayChoice(overlay.choiceId)?.nextScreenId ?? null)"
              @click="clickOverlayChoice(overlay.choiceId)"
            >
              <span
                class="overlay-choice-chip"
                :style="getOverlayChipStyle(overlay)"
              >
                {{ getOverlayChoice(overlay.choiceId)?.label }}
              </span>
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
                <div
                  v-for="item in collectedItems"
                  :key="item.id"
                  class="inventory-slot"
                  :class="{ locked: item.locked, empty: !item.icon }"
                  :title="item.label"
                >
                  <span v-if="item.icon" class="item-icon">{{ item.icon }}</span>
                </div>
              </div>
            </div>
          </aside>

          <aside class="achievement-panel" :class="{ open: isAchievementsOpen }">
            <div class="achievement-card">
              <div class="overlay-panel-header achievement-header">
                <strong>Osiagniecia</strong>
                <button
                  class="panel-close-button"
                  @click="closeAchievements"
                  aria-label="Zamknij osiagniecia"
                >
                  &times;
                </button>
              </div>
              <div class="achievement-progress">
                <div class="achievement-progress-copy">
                  {{ unlockedAchievements.length }} / {{ totalAchievementsCount }}
                </div>
                <div class="achievement-progress-track">
                  <div
                    class="achievement-progress-fill"
                    :style="{ width: `${(unlockedAchievements.length / totalAchievementsCount) * 100}%` }"
                  ></div>
                </div>
              </div>
              <div class="achievement-list">
                <article
                  v-for="item in unlockedAchievements"
                  :key="item.id"
                  class="achievement-entry"
                >
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
                <button class="toast-action" @click="saveItemToast">Dodaj do plecaka</button>
              </div>

              <div v-if="itemLostToast && !itemToast" class="achievement-toast item-lost-toast">
                <div class="achievement-toast-spark">&#10022;</div>
                <h3>Utrata artefaktu</h3>
                <span class="toast-icon item-lost-toast-icon">{{ itemLostToast.icon }}</span>
                <strong>{{ itemLostToast.label }}</strong>
                <p>{{ itemLostToast.description }}</p>
                <button class="toast-action" @click="saveItemLostToast">Akceptuję utratę</button>
              </div>

              <div
                v-if="achievementToast && !itemToast && !itemLostToast"
                class="achievement-toast achievement-toast-card"
              >
                <div class="achievement-toast-spark">&#10022;</div>
                <h3>Gratulacje!</h3>
                <span class="toast-icon">{{ achievementToast.icon }}</span>
                <strong>{{ achievementToast.label }}</strong>
                <p>{{ achievementToast.description }}</p>
                <button class="toast-action" @click="saveAchievementToast">Zapisz osiagniecie</button>
              </div>
            </div>
          </div>
        </div>
        </div>
      </section>
    </section>
  </main>
</template>

<style scoped>
:global(body) {
  margin: 0;
  font-family: Inter, Arial, sans-serif;
  background: #fff;
  overflow: hidden;
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
  overflow: hidden;
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

.game-frame {
  position: relative;
  width: min(1280px, calc((100vh - 32px) * 16 / 9), calc(100vw - 32px));
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: linear-gradient(135deg, #f6eb88 0%, #b6e374 52%, #89d18b 100%);
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
  grid-template-columns: 1fr auto auto;
  align-items: start;
  gap: 18px;
  padding: 22px 30px 16px;
  border-bottom: 2px solid rgba(49, 72, 93, 0.32);
}

.brand-block h1 {
  margin: 0;
  font-size: clamp(34px, 3.6vw, 58px);
  line-height: 0.95;
  color: #1d3b60;
  font-weight: 900;
}

.brand-block p {
  margin: 8px 0 0;
  font-size: 13px;
  color: #32506e;
}

.logos {
  justify-self: center;
  font-size: 22px;
  font-weight: 800;
  color: #d23d3d;
  text-align: center;
}

.menu-toggle {
  width: 54px;
  height: 54px;
  border: 1px solid rgba(104, 132, 158, 0.55);
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 6px 18px rgba(72, 97, 124, 0.22);
  display: grid;
  align-content: center;
  justify-items: center;
  gap: 5px;
  cursor: pointer;
}

.menu-toggle span {
  width: 22px;
  height: 2px;
  border-radius: 999px;
  background: #6f89a7;
}

.page-menu-toggle {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 50;
}

.side-menu {
  position: fixed;
  top: 84px;
  right: 20px;
  width: 0;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.96);
  border-radius: 16px;
  box-shadow: 0 14px 32px rgba(0, 0, 0, 0.18);
  transition: width 0.24s ease;
  z-index: 20;
}

.side-menu.open {
  width: 220px;
}

.side-menu a {
  display: block;
  padding: 14px 18px;
  color: #35506e;
  font-weight: 700;
  text-decoration: none;
  white-space: nowrap;
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
.intro-screen {
  display: grid;
  align-content: start;
  justify-items: center;
}

.welcome-layout,
.intro-layout {
  width: 100%;
  max-width: 960px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;
  gap: 36px;
  margin-top: 24px;
}

.welcome-image,
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

.welcome-copy p {
  margin: 0;
  color: #2f4a65;
  line-height: 1.6;
  font-size: 18px;
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
  margin-top: 28px;
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

.grzenia-hotspot {
  position: absolute;
  left: 72px;
  top: 112px;
  width: 230px;
  height: 335px;
  background: transparent;
  border: none;
  cursor: pointer;
}

.info-popup {
  position: absolute;
  width: 255px;
  padding: 14px 16px;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 12px 26px rgba(28, 41, 59, 0.22);
  color: #2e4056;
}

.info-popup strong {
  display: block;
  margin-bottom: 6px;
}

.info-popup p {
  margin: 0;
  font-size: 14px;
  line-height: 1.45;
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
  width: 70px;
  height:70px;
  border-radius: 22px;
  border: 2px solid #c8d3e7;
  background: #fff;
  cursor: pointer;
  box-shadow: 0 14px 28px rgba(65, 83, 104, 0.18);
  display: grid;
  place-items: center;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.icon-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 18px 30px rgba(65, 83, 104, 0.22);
}

.icon-button svg {
  width: 38px;
  height: 38px;
}

.backpack-icon-image {
  width: 42px;
  height: 42px;
  object-fit: contain;
}

.backpack-button {
  border-color: #9ed39f;
  color: #7ca9cf;
}

.trophy-button {
  border-color: #ff8b45;
  color: #f08c2a;
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
  min-width: 72px;
  height: 58px;
  border: 3px solid #2b2b2b;
  border-radius: 14px;
  background: #fffdf8;
  color: #1f1f1f;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  box-shadow: 0 8px 0 rgba(43, 43, 43, 0.18);
  cursor: pointer;
}

.back-button:disabled {
  opacity: 0.72;
  cursor: not-allowed;
  box-shadow: none;
}

.back-button span {
  font-size: 13px;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.choice-button {
  min-width: 240px;
  min-height: 58px;
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
  cursor: pointer;
}

.choice-button:disabled {
  opacity: 0.72;
  cursor: not-allowed;
  box-shadow: none;
}

.choice-button:last-child {
  background: #9fca7c;
}

.choice-overlay-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.overlay-choice-button {
  position: absolute;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  padding: 0;
  border: none;
  background: transparent;
  box-shadow: none;
  cursor: pointer;
  pointer-events: auto;
}

.choice-overlay-layer--centered .overlay-choice-button--centered {
  align-items: center;
  justify-content: center;
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
  padding: 26px 28px 24px;
  border-radius: 24px;
  background: #fffdf9;
  border: 3px solid #ffd972;
  box-shadow: 0 22px 44px rgba(79, 63, 17, 0.24);
  text-align: center;
}

.item-toast {
  top: 0;
  z-index: 2;
  border-color: #7db7ea;
  box-shadow: 0 22px 44px rgba(47, 93, 141, 0.22);
}

.item-lost-toast {
  top: 0;
  z-index: 2;
  border-color: #f09b9b;
  box-shadow: 0 22px 44px rgba(150, 63, 63, 0.22);
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
  border: none;
  border-radius: 999px;
  background: linear-gradient(180deg, #a8d88f 0%, #88c66d 100%);
  color: #ffffff;
  font-weight: 800;
  padding: 12px 22px;
  box-shadow: 0 10px 18px rgba(136, 198, 109, 0.35);
  cursor: pointer;
}

@media (max-width: 980px), (max-height: 500px) {
  .page {
    padding: 6px;
  }

  .page-menu-toggle {
    top: 8px;
    right: 8px;
    width: 44px;
    height: 44px;
    border-radius: 14px;
  }

  .menu-toggle span {
    width: 18px;
  }

  .side-menu {
    top: 58px;
    right: 8px;
  }

  .side-menu.open {
    width: min(220px, calc(100vw - 16px));
  }

  .game-frame {
    border-radius: 12px;
  }

  .framed-screen {
    height: calc(100% - 72px);
    padding: 12px 16px 18px;
  }

  .game-header {
    gap: 12px;
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
    font-size: 15px;
  }

  .welcome-layout,
  .intro-layout {
    gap: 18px;
    margin-top: 8px;
  }

  .welcome-image,
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
    min-width: 220px;
    height: 52px;
    margin-top: 18px;
    font-size: 22px;
  }

  .inventory-card {
    width: min(300px, calc(100vw - 24px));
    padding: 14px 14px 16px;
  }

  .inventory-items {
    gap: 14px;
  }

  .inventory-slot {
    width: 62px;
    height: 62px;
  }

  .item-icon {
    font-size: 38px;
  }

  .achievement-card {
    max-height: min(430px, calc(100vh - 88px));
  }

  .achievement-entry {
    padding: 10px;
  }

  .achievement-entry-icon {
    width: 42px;
    height: 42px;
    font-size: 22px;
  }

  .achievement-entry-copy strong {
    font-size: 14px;
  }

  .achievement-entry-copy p {
    font-size: 11px;
  }

  .reward-stack {
    width: min(380px, calc(100vw - 24px));
    height: min(440px, calc(100vh - 24px));
  }

  .achievement-toast {
    padding: 18px 18px 16px;
    border-radius: 20px;
  }

  .toast-icon {
    width: 62px;
    height: 62px;
    margin-bottom: 12px;
    font-size: 30px;
  }

  .achievement-toast h3 {
    margin-bottom: 12px;
    font-size: 22px;
  }

  .achievement-toast strong {
    margin-bottom: 6px;
    font-size: 28px;
  }

  .achievement-toast p {
    font-size: 14px;
  }

  .toast-action {
    min-width: 200px;
    height: 44px;
    font-size: 15px;
  }
}

@media (max-width: 980px) and (orientation: landscape), (max-height: 500px) and (orientation: landscape) {
  .story-frame {
    width: calc(100vw - 12px);
  }

  .story-screen {
    place-items: start center;
  }

  .comic-stage {
    margin-top: -10px;
  }
}
</style>
