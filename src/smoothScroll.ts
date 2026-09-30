/**
 * Ultra-smooth Apple gravitational momentum smooth scrolling.
 * Emulates the iconic high-inertia macOS / iOS fluid physics:
 * - Viscous fluid damping (gravitational mass decay)
 * - Slow exponential velocity decay for an ultra-long, luxurious deceleration glide
 * - Sub-pixel precision integration
 * - Zero abrupt stopping (asymptotically floats to an effortless rest)
 */

interface SmoothScrollInstance {
  destroy: () => void;
}

export function initAppleSmoothScroll(): SmoothScrollInstance {
  // Ultra-luxurious viscous friction: 0.945 gives long, slow, velvet glide
  const VISCOSITY = 0.948;
  const IMPULSE_RATIO = 0.32;
  const MIN_VELOCITY = 0.08;
  const MAX_VELOCITY = 38;

  let activeElement: HTMLElement | null = null;
  let targetScrollTop = 0;
  let currentScrollTop = 0;
  let animationFrameId: number | null = null;

  // Helper to find nearest scrollable ancestor
  const findScrollableParent = (target: HTMLElement | null): HTMLElement | null => {
    let el = target;
    while (el && el !== document.body && el !== document.documentElement) {
      const style = window.getComputedStyle(el);
      const isScrollable =
        (style.overflowY === "auto" || style.overflowY === "scroll") &&
        el.scrollHeight > el.clientHeight;
      if (isScrollable) return el;
      el = el.parentElement;
    }
    return null;
  };

  const update = () => {
    if (!activeElement) {
      animationFrameId = null;
      return;
    }

    // High-inertia asymptotic interpolation (buttery smooth viscous glide)
    // Moves current position toward target using luxurious gravitational easing
    const diff = targetScrollTop - currentScrollTop;
    const step = diff * (1 - VISCOSITY);

    if (Math.abs(diff) > MIN_VELOCITY) {
      currentScrollTop += step;
      activeElement.scrollTop = Math.round(currentScrollTop * 100) / 100;
      animationFrameId = requestAnimationFrame(update);
    } else {
      currentScrollTop = targetScrollTop;
      activeElement.scrollTop = targetScrollTop;
      animationFrameId = null;
    }
  };

  const onWheel = (e: WheelEvent) => {
    // Only intercept standard vertical wheel scrolls
    if (e.ctrlKey || e.shiftKey) return;

    const scrollTarget = findScrollableParent(e.target as HTMLElement);
    if (!scrollTarget) return;

    const maxScroll = scrollTarget.scrollHeight - scrollTarget.clientHeight;
    if (maxScroll <= 0) return;

    const deltaY = e.deltaY;
    // Let edge boundaries rest naturally
    if (
      (deltaY < 0 && scrollTarget.scrollTop <= 0 && targetScrollTop <= 0) ||
      (deltaY > 0 && scrollTarget.scrollTop >= maxScroll && targetScrollTop >= maxScroll)
    ) {
      return;
    }

    e.preventDefault();

    if (activeElement !== scrollTarget) {
      activeElement = scrollTarget;
      currentScrollTop = scrollTarget.scrollTop;
      targetScrollTop = scrollTarget.scrollTop;
    }

    // Apply soft, weighted gravitational impulse
    const impulse = Math.sign(deltaY) * Math.min(Math.abs(deltaY) * IMPULSE_RATIO, MAX_VELOCITY * 3.5);
    targetScrollTop = Math.max(0, Math.min(maxScroll, targetScrollTop + impulse * 2.8));

    if (!animationFrameId) {
      animationFrameId = requestAnimationFrame(update);
    }
  };

  window.addEventListener("wheel", onWheel, { passive: false });

  return {
    destroy: () => {
      window.removeEventListener("wheel", onWheel);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    },
  };
}
