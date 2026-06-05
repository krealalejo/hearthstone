import { ref, onMounted } from "vue";
import { useTheme } from "vuetify";
import { gsap } from "gsap";

const isDark = ref(false);

const DARK_BG = "#14110e";
const LIGHT_BG = "#f9f6f1";

export function useColorMode() {
  const vuetifyTheme = useTheme();

  function apply(dark: boolean) {
    isDark.value = dark;
    vuetifyTheme.change(dark ? "dark" : "light");
    if (import.meta.client) {
      document.documentElement.dataset.theme = dark ? "dark" : "light";
      localStorage.setItem("theme", dark ? "dark" : "light");
    }
  }

  onMounted(() => {
    const saved = localStorage.getItem("theme");
    if (saved) {
      apply(saved === "dark");
    } else {
      const prefersDark = globalThis.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      apply(prefersDark);
    }
  });

  function toggle(btn?: Element | null) {
    if (!import.meta.client) return;

    const next = !isDark.value;

    // Spin the button icon
    if (btn) {
      gsap.fromTo(
        btn,
        { rotate: 0 },
        {
          rotate: 180,
          duration: 0.35,
          ease: "back.out(1.4)",
          clearProps: "transform",
        },
      );
    }

    // Overlay cross-fade: cover with target-theme bg, switch, reveal
    const overlay = document.createElement("div");
    overlay.style.cssText = `position:fixed;inset:0;z-index:99999;pointer-events:none;background:${next ? DARK_BG : LIGHT_BG};opacity:0;`;
    document.body.appendChild(overlay);

    gsap.to(overlay, {
      opacity: 1,
      duration: 0.18,
      ease: "power2.in",
      onComplete() {
        apply(next);
        gsap.to(overlay, {
          opacity: 0,
          duration: 0.28,
          ease: "power2.out",
          onComplete() {
            overlay.remove();
          },
        });
      },
    });
  }

  return { isDark, toggle };
}
