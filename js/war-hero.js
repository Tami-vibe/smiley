/** Warranty hero clips play once. A pointer move over a finished column restarts that clip. */
export function mountWarHero(root = document) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  root.querySelectorAll(".war-hero figure video").forEach((video) => {
    video.loop = false;
    video.removeAttribute("loop");
    if (reduce) {
      video.removeAttribute("autoplay");
      video.pause();
      return;
    }
    const figure = video.closest("figure");
    if (!figure) return;
    figure.addEventListener("pointermove", () => {
      if (!video.paused && !video.ended) return;
      try { video.currentTime = 0; } catch (_) { /* not seekable yet */ }
      const pending = video.play();
      if (pending && typeof pending.catch === "function") pending.catch(() => {});
    });
  });
}

mountWarHero();
