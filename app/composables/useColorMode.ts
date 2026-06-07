import { ref, onMounted } from "vue";
import { useTheme } from "vuetify";
import { gsap } from "gsap";

const isDark = ref(false);

const DARK_BG = "#14110e";
const LIGHT_BG = "#f9f6f1";

function scheduleThemeSwapRemoval() {
  requestAnimationFrame(() =>
    requestAnimationFrame(() =>
      document.documentElement.classList.remove("theme-swap"),
    ),
  );
}

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

    if (btn) {
      const icon = btn.querySelector("i") ?? btn;
      gsap.fromTo(
        icon,
        { rotate: 0, scale: 1 },
        {
          rotate: 360,
          scale: 1,
          duration: 0.5,
          ease: "power2.inOut",
          clearProps: "transform",
        },
      );
    }

    const overlay = document.createElement("div");
    overlay.style.cssText = `position:fixed;inset:0;z-index:99999;pointer-events:none;background:${next ? DARK_BG : LIGHT_BG};opacity:0;`;
    document.body.appendChild(overlay);

    gsap.to(overlay, {
      opacity: 1,
      duration: 0.18,
      ease: "power2.in",
      onComplete() {
        document.documentElement.classList.add("theme-swap");
        apply(next);
        scheduleThemeSwapRemoval();
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
