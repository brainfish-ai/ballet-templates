// Mounts the 3D pieces wherever a page asks for them. [data-pieces] holds a
// still, a canvas, and optionally one [data-piece-label] per step. The still
// is the default: the live scene only loads on a desktop-class screen that
// allows motion, starts once it's near the viewport, and rests whenever it
// scrolls away. Phones keep the still.
import type { BlockState, PieceStep, Variant } from "./scene";

/**
 * Once the page has painted its first frame, so the 3D never holds up first
 * paint. (It used to wait for the load event and then an idle moment, and the
 * load event waits on every analytics script: the hero sat empty for a second
 * or more before the scene even began to download.)
 */
const painted = new Promise<void>((resolve) => {
  const go = () => requestAnimationFrame(() => setTimeout(resolve, 0));
  if (document.readyState !== "loading") go();
  else addEventListener("DOMContentLoaded", go, { once: true });
});

export function mountPieces(root: ParentNode = document) {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const capable = matchMedia("(pointer: fine) and (min-width: 900px)").matches;
  const els = [...root.querySelectorAll<HTMLElement>("[data-pieces]")];
  if (!els.length) return;
  // fetched once, as soon as the page has painted, whether or not a scene is in view yet
  const sceneModule = painted.then(() => import("./scene"));

  for (const el of els) {
    const canvas = el.querySelector("canvas");
    if (!canvas) continue;
    const variant = (el.dataset.pieces || "lattice") as Variant;
    const settle = el.dataset.settle === "true";
    const greyPieces = el.dataset.greyPieces === "true";
    const steps = JSON.parse(el.dataset.steps || "[]") as PieceStep[];
    const labels = [...el.querySelectorAll<HTMLElement>("[data-piece-label]")];
    // the labels follow the blocks; until the scene runs they keep their still positions
    const onFrame = labels.length
      ? (blocks: BlockState[]) => {
          blocks.forEach((b, i) => {
            const label = labels[i];
            if (!label) return;
            label.style.left = `${(b.x * 100).toFixed(2)}%`;
            label.style.top = `${(b.y * 100).toFixed(2)}%`;
            label.style.opacity = b.shown.toFixed(3);
            label.classList.toggle("is-done", b.done > 0.5);
          });
        }
      : undefined;

    let scene: { setActive(on: boolean): void; renderAt(t: number): void; settled: number } | null = null;
    let loading = false;
    const io = new IntersectionObserver(
      async ([entry]) => {
        if (entry.isIntersecting && !scene && !loading) {
          loading = true;
          try {
            const { createPieces } = await sceneModule;
            scene = createPieces({
              canvas,
              variant,
              steps,
              reduced: reduced || !capable,
              settle,
              greyPieces,
              onFrame,
              still: import.meta.env.DEV,
            });
            el.classList.add("is-live");
            if (import.meta.env.DEV) (el as unknown as { __pieces: unknown }).__pieces = scene;
          } catch (err) {
            // no WebGL: the still stays, or comes back where it was kept hidden for the scene (and in development, say why)
            el.classList.add("is-still");
            if (import.meta.env.DEV) console.error(err);
            return;
          }
        }
        scene?.setActive(entry.isIntersecting);
      },
      { rootMargin: "200px 0px" },
    );
    io.observe(el);
  }
}
