import { gsap } from "gsap";

function rand(): number {
  const arr = new Uint32Array(1);
  globalThis.crypto.getRandomValues(arr);
  return (arr[0] ?? 0) / 0x100000000;
}

const COLORS = ["#5cb572", "#5aa3ec", "#e38d3d", "#e66e68", "#c282d0"];

function fire() {
  if (typeof document === "undefined") return;
  const cx = globalThis.innerWidth / 2;
  const cy = globalThis.innerHeight - 90;

  for (let i = 0; i < 26; i++) {
    const el = document.createElement("div");
    el.className = "confetti-dot";
    el.style.background = COLORS[i % COLORS.length] ?? COLORS[0] ?? "";
    el.style.left = cx + "px";
    el.style.top = cy + "px";
    el.style.borderRadius = rand() > 0.5 ? "50%" : "2px";
    document.body.appendChild(el);

    const ang = Math.PI * (0.15 + rand() * 0.7) * -1;
    const vel = 180 + rand() * 260;
    const dx = Math.cos(ang) * vel * (rand() > 0.5 ? 1 : -1);
    const dy = Math.sin(ang) * vel - 120;

    gsap.to(el, {
      x: dx,
      y: dy + 360,
      rotation: rand() * 720 - 360,
      opacity: 0,
      duration: 1.1 + rand() * 0.7,
      ease: "cubic-bezier(0.2, 0.6, 0.4, 1)",
      onComplete: () => el.remove(),
    });
  }
}

export function useConfetti() {
  return { fire };
}
