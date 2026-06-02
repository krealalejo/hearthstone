import { gsap } from "gsap";

const COLORS = [
  "oklch(0.7 0.13 150)",
  "oklch(0.7 0.13 250)",
  "oklch(0.72 0.14 60)",
  "oklch(0.68 0.15 25)",
  "oklch(0.7 0.13 320)",
];

export function useConfetti() {
  function fire() {
    if (typeof document === "undefined") return;
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight - 90;

    for (let i = 0; i < 26; i++) {
      const el = document.createElement("div");
      el.className = "confetti-dot";
      el.style.background = COLORS[i % COLORS.length] ?? COLORS[0]!;
      el.style.left = cx + "px";
      el.style.top = cy + "px";
      el.style.borderRadius = Math.random() > 0.5 ? "50%" : "2px";
      document.body.appendChild(el);

      const ang = Math.PI * (0.15 + Math.random() * 0.7) * -1;
      const vel = 180 + Math.random() * 260;
      const dx = Math.cos(ang) * vel * (Math.random() > 0.5 ? 1 : -1);
      const dy = Math.sin(ang) * vel - 120;

      gsap.to(el, {
        x: dx,
        y: dy + 360,
        rotation: Math.random() * 720 - 360,
        opacity: 0,
        duration: 1.1 + Math.random() * 0.7,
        ease: "cubic-bezier(0.2, 0.6, 0.4, 1)",
        onComplete: () => el.remove(),
      });
    }
  }

  return { fire };
}
