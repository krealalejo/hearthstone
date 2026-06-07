import { gsap } from "gsap";

const EASE = "cubic-bezier(0.32, 0.72, 0, 1)";

function animateIn(el: Element | null, opts?: gsap.TweenVars) {
  if (!el) return;
  gsap.from(el, { opacity: 0, y: 8, duration: 0.22, ease: EASE, ...opts });
}

function animateModalIn(el: Element | null) {
  if (!el) return;
  gsap.from(el, { opacity: 0, y: 12, scale: 0.97, duration: 0.26, ease: EASE });
}

function animateToastIn(el: Element | null) {
  if (!el) return;
  gsap.from(el, { opacity: 0, y: 16, scale: 0.94, duration: 0.4, ease: EASE });
}

function animateShopItemIn(el: Element | null) {
  if (!el) return;
  gsap.from(el, {
    opacity: 0,
    y: -14,
    scale: 0.96,
    duration: 0.7,
    ease: EASE,
    onComplete() {
      gsap.set(el, { clearProps: "all" });
    },
  });
}

function animateCheckToggle(el: Element | null, checked: boolean) {
  if (!el) return;
  gsap.to(el, {
    keyframes: { scale: checked ? [1.25, 1] : [0.85, 1] },
    duration: 0.2,
    ease: "back.out(2)",
  });
}

function animateLocaleIn(
  el: Element,
  resolve: () => void,
  onMid: () => void | Promise<void>,
) {
  Promise.resolve(onMid()).then(() => {
    gsap.fromTo(
      el,
      { opacity: 0, y: 6 },
      { opacity: 1, y: 0, duration: 0.22, ease: EASE, onComplete: resolve },
    );
  });
}

function animateLocaleChange(
  el: Element | null,
  onMid: () => void | Promise<void>,
) {
  if (!el) return Promise.resolve(onMid());
  return new Promise<void>((resolve) => {
    gsap.to(el, {
      opacity: 0,
      y: -6,
      duration: 0.16,
      ease: EASE,
      onComplete() {
        animateLocaleIn(el, resolve, onMid);
      },
    });
  });
}

function animateStagger(els: NodeListOf<Element> | Element[]) {
  gsap.from(Array.from(els), {
    opacity: 0,
    y: 12,
    duration: 0.2,
    stagger: 0.04,
    ease: EASE,
  });
}

export function useAnimations() {
  return {
    animateIn,
    animateModalIn,
    animateToastIn,
    animateShopItemIn,
    animateCheckToggle,
    animateLocaleChange,
    animateStagger,
  };
}
