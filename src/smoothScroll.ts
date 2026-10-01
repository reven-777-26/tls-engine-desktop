/**
 * Hardware-Aware Smooth Scrolling.
 * 
 * IMPORTANT: macOS trackpads and precision touchpads already have hardware-accelerated,
 * 120Hz sub-pixel momentum physics and elasticity (rubber-banding) built into the OS.
 * Intercepting trackpad gestures with preventDefault() causes extreme sluggishness,
 * input lag, and unnatural friction.
 * 
 * This module:
 * 1. Intelligently detects trackpad / precision touch gestures and allows them to scroll
 *    100% natively at full macOS hardware speed.
 * 2. Applies fluid, snappy easing exclusively to discrete notched mouse wheels (e.g. external USB/Bluetooth mice).
 */

interface SmoothScrollInstance {
  destroy: () => void;
}

export function initAppleSmoothScroll(): SmoothScrollInstance {
  // Damping factor for discrete mouse wheels (snappy ~180ms ease-out)
  const DAMPING = 0.85;
  const MIN_VELOCITY = 0.5;

  let activeElement: HTMLElement | null = null;
  let targetScrollTop = 0;
  let currentScrollTop = 0;
  let animationFrameId: number | null = null;

  // Trackpad gesture state tracking
  let isTrackpadGesture = false;
  let trackpadResetTimer: ReturnType<typeof setTimeout> | null = null;

  const isLikelyTrackpad = (e: WheelEvent): boolean => {
    // Discrete mouse wheels typically have deltaMode === 1 (lines) or 2 (pages)
    if (e.deltaMode !== 0) return false;

    // Trackpads emit fractional pixel deltas due to continuous sub-pixel gestures
    if (!Number.isInteger(e.deltaY) || !Number.isInteger(e.deltaX)) {
      return true;
    }

    // Two-finger gestures almost always produce subtle horizontal delta drift
    if (Math.abs(e.deltaX) > 0) {
      return true;
    }

    // Trackpad gestures start with low delta values (< 35px).
    // Notched mouse wheels produce discrete steps of 50-120px+ per notch.
    if (Math.abs(e.deltaY) > 0 && Math.abs(e.deltaY) < 35) {
      return true;
    }

    return false;
  };

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

    const diff = targetScrollTop - currentScrollTop;
    const step = diff * (1 - DAMPING);

    if (Math.abs(diff) > MIN_VELOCITY) {
      currentScrollTop += step;
      activeElement.scrollTop = Math.round(currentScrollTop * 10) / 10;
      animationFrameId = requestAnimationFrame(update);
    } else {
      currentScrollTop = targetScrollTop;
      activeElement.scrollTop = targetScrollTop;
      animationFrameId = null;
    }
  };

  const onWheel = (e: WheelEvent) => {
    // Skip modified wheel events (zoom, horizontal shifts)
    if (e.ctrlKey || e.shiftKey) return;

    // Detect trackpad gesture
    if (isLikelyTrackpad(e)) {
      isTrackpadGesture = true;
      if (trackpadResetTimer) clearTimeout(trackpadResetTimer);
      trackpadResetTimer = setTimeout(() => {
        isTrackpadGesture = false;
      }, 250);
    }

    // For trackpads: NEVER preventDefault! Allow full native macOS inertia & speed
    if (isTrackpadGesture) {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      activeElement = null;
      return;
    }

    // For discrete mouse wheels: provide smooth interpolation
    const scrollTarget = findScrollableParent(e.target as HTMLElement);
    if (!scrollTarget) return;

    const maxScroll = scrollTarget.scrollHeight - scrollTarget.clientHeight;
    if (maxScroll <= 0) return;

    // Convert lines to pixels if needed (e.g. on Windows / Linux)
    const rawDelta = e.deltaMode === 1 ? e.deltaY * 33 : e.deltaY;

    // Boundary check: don't intercept at edges
    if (
      (rawDelta < 0 && scrollTarget.scrollTop <= 0) ||
      (rawDelta > 0 && scrollTarget.scrollTop >= maxScroll)
    ) {
      return;
    }

    e.preventDefault();

    if (activeElement !== scrollTarget) {
      activeElement = scrollTarget;
      currentScrollTop = scrollTarget.scrollTop;
      targetScrollTop = scrollTarget.scrollTop;
    }

    targetScrollTop = Math.max(0, Math.min(maxScroll, targetScrollTop + rawDelta));

    if (!animationFrameId) {
      animationFrameId = requestAnimationFrame(update);
    }
  };

  window.addEventListener("wheel", onWheel, { passive: false });

  return {
    destroy: () => {
      window.removeEventListener("wheel", onWheel);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (trackpadResetTimer) clearTimeout(trackpadResetTimer);
    },
  };
}
