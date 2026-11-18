// Ballet's mark, made into the pieces of a workflow. Three ways:
//
//   puzzle   the tools a team runs on, laid out as a jigsaw in a quiet grey,
//            from the outside in, leaving a hole in the middle the shape of
//            the mark; then Ballet lands in it, its two pieces, the square on
//            its neck with the ball, then the bowl, which clicks in round the
//            ball; and with the click a pulse runs out across the table. Till
//            then the tools lie loose, apart; as the pulse reaches each, it
//            slides in, locks onto its neighbours and turns green, connected.
//   lattice  the mark extended: squares for systems, balls for Ballet, the
//            mark's neck between each, the last ball in the mark's bowl.
//   mark     the logo alone, assembling from its pieces.
//
// Small on purpose: a handful of meshes, no post-processing, paused when off
// screen. Phones never load it; they get a still rendered from this scene.

import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { field, logoSlot, type FieldPiece } from "../../lib/field";
import { readBrand } from "./brand";

export type Variant = "puzzle" | "lattice" | "mark";

export interface PieceStep {
  /** A system: its logo (in the puzzle, on one of the pieces). */
  logo?: string;
  /** In the puzzle, the tool's own colour, where reading it off its logo wouldn't give the right one. */
  color?: string;
  /** Ballet's own work: in the lattice, one of the mark's balls. */
  ballet?: boolean;
}

/** Where each piece's label belongs on screen, as fractions of the canvas, and how far along it is. */
export interface BlockState {
  x: number;
  y: number;
  /** 0 → 1 as it arrives. */
  shown: number;
  /** 0 → 1 as the run passes it. */
  done: number;
}

export interface PiecesOptions {
  canvas: HTMLCanvasElement;
  variant: Variant;
  steps: PieceStep[];
  reduced: boolean;
  /** Keep the drawing buffer, for reading stills back. */
  still?: boolean;
  /** Play through the assembly once and settle at the finished state. */
  settle?: boolean;
  onFrame?: (pieces: BlockState[]) => void;
}

export interface Pieces {
  setActive(on: boolean): void;
  /** Poses and draws one frame at time t (seconds). */
  renderAt(t: number): void;
  /** The moment in the loop where everything is built and run. */
  readonly settled: number;
  /** Re-fits the drawing buffer and camera to the canvas's current size. */
  resize(): void;
  dispose(): void;
}

// The mark's own paths, in its 592-unit box (y down).
const MARK = {
  bowl: "M287.513 139.778H318.395C415.044 139.778 493.393 218.49 493.393 315.586C493.393 412.681 415.044 491.393 318.395 491.393H287.513V447.808C287.513 433.802 298.814 422.449 312.755 422.449H318.395C377.142 422.449 424.766 374.605 424.766 315.586C424.766 256.567 377.142 208.722 318.395 208.722H312.755C298.814 208.722 287.513 197.369 287.513 183.364V139.778Z",
  square: "M109.393 125.899C109.393 115.678 117.678 107.393 127.899 107.393H229.682C239.903 107.393 248.188 115.678 248.188 125.899V227.682C248.188 237.903 239.903 246.188 229.682 246.188H127.899C117.678 246.188 109.393 237.903 109.393 227.682V125.899Z",
  neck: "M248.188 315.586C248.188 277.857 218.081 247.162 180.582 246.211L178.79 246.188L178.79 176.79L248.188 176.79C248.188 215.118 279.258 246.188 317.586 246.188V315.586H248.188Z",
};
const BALL = { x: 317.586, y: 315.586, r: 69.4 };
const SQUARE = { x: 178.79, y: 176.79 };
const NECK = { x: 248.188, y: 246.188 };
/** The logo's square-to-ball spacing, on each axis. */
const STEP = BALL.x - SQUARE.x;

const PALETTE = {
  block: "#ffffff",
  ball: "#8a5bd1",
  bowl: "#2a1f5e",
  neck: "#c9b6f2",
  square: "#efe7ff",
  done: "#2fae6c",
};

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
/** How long the puzzle's pulse takes to run out from the mark and fade. */
const PULSE_DUR = 1.6;
/** How long a loose tool takes to slide in and lock on, once the pulse reaches it. */
const SNAP = 0.26;
const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
/** Ease out with a small overshoot, for a piece popping into being. */
const popOut = (t: number) => {
  t = clamp01(t) - 1;
  return 1 + t * t * (2.7 * t + 1.7);
};
/** Ease out with a small overshoot: a piece dropping into place. */
const seat = (t: number) => {
  t = clamp01(t);
  const c = 1.5;
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
};

/** One of the mark's paths as a solid: extruded, softly bevelled, centred in depth (SVG coordinates). */
function extrude(d: string, depth: number, bevel: number) {
  const data = new SVGLoader().parse(`<svg xmlns="http://www.w3.org/2000/svg"><path d="${d}"/></svg>`);
  const shapes = data.paths.flatMap((p) => SVGLoader.createShapes(p));
  const geo = new THREE.ExtrudeGeometry(shapes, {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel * 0.85,
    bevelSegments: 8,
    curveSegments: 48,
  });
  geo.translate(0, 0, -depth / 2);
  return geo;
}

/** The same, stood up the logo's way: y up, faces toward +z. */
function upright(d: string, depth: number, bevel: number) {
  const geo = extrude(d, depth, bevel);
  geo.scale(1, -1, 1);
  const p = geo.attributes.position as THREE.BufferAttribute;
  const n = geo.attributes.normal as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i += 3) {
    for (const a of [p, n]) {
      const x = a.getX(i + 1), y = a.getY(i + 1), z = a.getZ(i + 1);
      a.setXYZ(i + 1, a.getX(i + 2), a.getY(i + 2), a.getZ(i + 2));
      a.setXYZ(i + 2, x, y, z);
    }
  }
  return geo;
}

/** A system's face: its logo, inset on white. */
function logoTexture(src: string | undefined, size: number, onReady: () => void) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  g.fillStyle = PALETTE.block;
  g.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  if (src) {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const s = size * 0.56, at = (size - s) / 2;
      g.save();
      g.beginPath();
      g.roundRect(at, at, s, s, s * 0.22);
      g.clip();
      g.drawImage(img, at, at, s, s);
      g.restore();
      tex.needsUpdate = true;
      onReady();
    };
    img.src = src;
  }
  return tex;
}

/** A tool's logo as a white glyph, and its colour, once read off the logo (see brand.ts). */
function toolFace(src: string | undefined, color: string | undefined, onReady: (color: string) => void) {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  if (src)
    readBrand(src, color)
      .then((b) => {
        c.getContext("2d")!.drawImage(b.glyph, 0, 0);
        tex.needsUpdate = true;
        onReady(b.color);
      })
      .catch(() => {});
  return tex;
}

/** A fixed scatter per piece, the same every time. */
const scatter = (i: number, k: number) => {
  const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

export function createPieces(o: PiecesOptions): Pieces {
  const renderer = new THREE.WebGLRenderer({
    canvas: o.canvas,
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: !!o.still,
    powerPreference: "low-power",
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;
  // a long lens, so the near pieces don't loom over the far ones
  const camera = new THREE.PerspectiveCamera(o.variant === "mark" ? 24 : o.variant === "puzzle" ? 20 : 17, 1, 0.1, 200);

  // the puzzle's light is neutral, so its white sides read white against a warm page
  const puzzle = o.variant === "puzzle";
  scene.add(new THREE.HemisphereLight(puzzle ? "#ffffff" : "#fff8f0", "#d9cfe8", 1.15));
  const key = new THREE.DirectionalLight(puzzle ? "#ffffff" : "#fff4e6", 2.2);
  key.position.set(-4, 10, 6);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8 });
  key.shadow.radius = 7;
  key.shadow.bias = -0.0004;
  scene.add(key);

  // the floor: invisible, it only catches the soft shadows
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity: puzzle ? 0.24 : 0.12 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // clay: matte, with just enough sheen to round the forms
  const clay = (color: string, roughness = 0.5) =>
    new THREE.MeshPhysicalMaterial({
      color,
      roughness,
      clearcoat: 0.25,
      clearcoatRoughness: 0.5,
      sheen: 0.35,
      sheenRoughness: 0.6,
      sheenColor: new THREE.Color("#ffffff"),
    });
  const mats = {
    block: clay(PALETTE.block, 0.45),
    bowl: clay(PALETTE.bowl, 0.42),
    neck: clay(PALETTE.neck, 0.5),
    link: clay("#f4f1fb", 0.5),
    square: clay(PALETTE.square, 0.48),
  };

  let running = false;
  let clock = 0;
  const redraw = () => {
    if (!running) renderAt(clock);
  };

  const root = new THREE.Group();
  scene.add(root);
  const solid = <T extends THREE.Object3D>(m: T) => {
    m.traverse((c) => {
      c.castShadow = true;
      c.receiveShadow = true;
    });
    return m;
  };

  /* ---------- the lattice: the logo, extended ---------- */
  interface Piece {
    group: THREE.Group;
    /** The neck back to the piece before it, if any. */
    neck?: THREE.Mesh;
    /** Ballet's balls glow as the run passes them. */
    glow?: THREE.MeshPhysicalMaterial;
    kind: "system" | "ballet";
    home: THREE.Vector3;
    /** The upper row of the zigzag, where the logo keeps its square. */
    up: boolean;
  }
  const pieces: Piece[] = [];
  let bowl: THREE.Mesh | null = null;
  const K = 0.0056; // mark units → world
  const D = STEP * K;
  /** Everything is cut from one slab, as the mark would be: the same depth, faces flush. */
  const SLAB = 0.36;
  const BEVEL = 8;
  const DEPTH_U = SLAB / K - 2 * BEVEL;
  /** How far the bowl reaches below its ball: the lattice stands on that. */
  const REACH = (176 + BEVEL) * K;
  const T = {
    arrive: (i: number) => 0.25 + i * 0.36,
    pass: (i: number) => 0.4 + pieces.length * 0.36 + 0.45 + i * 0.42,
    loop: 10,
  };

  if (o.variant === "lattice") {
    const side = (STEP + 2 * BEVEL) * K;
    const blockGeo = new RoundedBoxGeometry(side, side, SLAB, 5, (18.5 + BEVEL) * K);
    const ballGeo = new THREE.SphereGeometry((BALL.r + BEVEL) * K, 48, 32).scale(1, 1, 0.62);
    // the logo's own neck, square corner to ball, the way it runs down the
    // mark; turned a quarter for the links that climb back up the zigzag. In
    // the mark it's the square's colour; here it's set a touch behind the
    // faces, so the two never fight for the same plane.
    const neckDown = upright(MARK.neck, DEPTH_U * 0.62, BEVEL).translate(-NECK.x, NECK.y, 0);
    neckDown.scale(K, K, K);
    const neckUp = neckDown.clone().rotateZ(Math.PI / 2);

    const steps = o.steps.length ? o.steps : [{ ballet: true }];
    const base = REACH + 0.02;
    steps.forEach((step, i) => {
      const up = i % 2 === 0;
      const home = new THREE.Vector3(i * D, base + (up ? D : 0), 0);
      const group = new THREE.Group();
      let glow: THREE.MeshPhysicalMaterial | undefined;
      if (step.ballet) {
        glow = clay(PALETTE.ball, 0.34);
        glow.emissive = new THREE.Color(PALETTE.ball);
        glow.emissiveIntensity = 0;
        group.add(new THREE.Mesh(ballGeo, glow));
      } else {
        const face = new THREE.MeshPhysicalMaterial({ roughness: 0.45, clearcoat: 0.25, clearcoatRoughness: 0.5, map: logoTexture(step.logo, 512, redraw) });
        // RoundedBoxGeometry keeps BoxGeometry's six groups; +z (index 4) is the face
        group.add(new THREE.Mesh(blockGeo, [mats.block, mats.block, mats.block, mats.block, face, mats.block]));
      }
      group.position.copy(home);
      root.add(solid(group));
      const piece: Piece = { group, glow, kind: step.ballet ? "ballet" : "system", home, up };
      if (i > 0) {
        // from the piece before, on the other row
        const neck = new THREE.Mesh(up ? neckUp : neckDown, mats.link);
        neck.position.set(home.x - D / 2, base + D / 2, 0);
        root.add(solid(neck));
        piece.neck = neck;
      }
      pieces.push(piece);
    });

    // the last of Ballet's balls sits in the logo's bowl: the end of the chain is the mark itself
    const last = pieces[pieces.length - 1];
    if (last.kind === "ballet") {
      const geo = upright(MARK.bowl, DEPTH_U, BEVEL).translate(-BALL.x, BALL.y, 0);
      geo.scale(K, K, K);
      bowl = new THREE.Mesh(geo, clay(PALETTE.bowl, 0.42));
      (bowl.material as THREE.MeshPhysicalMaterial).emissive = new THREE.Color(PALETTE.done);
      (bowl.material as THREE.MeshPhysicalMaterial).emissiveIntensity = 0;
      bowl.position.copy(last.home);
      root.add(solid(bowl));
    }
  }

  /* ---------- the puzzle: the mark in pieces, and tools locking on round it ---------- */
  interface Bit {
    group: THREE.Group;
    /**
     * A tool's own materials; when the pulse reaches it, once Ballet's in;
     * and how it lies till then, loose: out from its place, and a little turned.
     */
    lit?: { at: number; to: Tone; body: THREE.MeshPhysicalMaterial; edge: THREE.MeshPhysicalMaterial; glyph?: THREE.MeshStandardMaterial; loose: [number, number]; twist: number };
    home: THREE.Vector3;
    /** Where it comes in from, as an offset from home. */
    from: THREE.Vector3;
    yaw: number;
    /** When it appears, how long it hangs there squared up before it drops, how long the drop takes, and when it's taken away again. */
    at: number;
    hang: number;
    dur: number;
    off: number;
    /** One of the mark's own pieces, rather than a tool. */
    mark: boolean;
  }
  type Tone = { body: THREE.Color; edge: THREE.Color; glyph: THREE.Color };
  const bits: Bit[] = [];
  const THICK = 0.16;
  // a tool before it's connected: grey, its logo in grey, like all the rest
  const GREY: Tone = { body: new THREE.Color("#dcdbe0"), edge: new THREE.Color("#c3c1c9"), glyph: new THREE.Color("#a09ea8") };
  // the connected green, the mint it fades to far from the mark, and how much
  // darker a piece's sides are than its face: a soft jade (a darker green
  // fading into the page's lilac white read as a swamp, a saturated emerald
  // glared). In development a page can try others, for comparing them.
  const PAL = { deep: "#3aa47c", far: "#f4faf7", ring: "#bfe9d3", edge: 0.8, ...((import.meta.env.DEV && (globalThis as { __pal?: object }).__pal) || {}) } as { deep: string; far: string; ring: string; edge: number };
  const GREEN = new THREE.Color(PAL.deep);
  /** When things happen: set once the field is cut, since it depends on how far it reaches. */
  let pulseRing: { mesh: THREE.Mesh; at: (u: number) => number } | null = null;
  /**
   * The green a connected tool takes is painted on its surface, not chosen
   * per piece: deepest beside the mark and fading out with distance, across
   * the seams, so the colour reads as spreading from Ballet rather than as one
   * solid shape. The pulse paints it as it passes: everything inside `uRing`
   * (in the field's units, from the mark's middle) is coloured, the rest grey.
   */
  const litU = {
    uMid: { value: new THREE.Vector2(-0.15, -0.1) },
    uRing: { value: 0 },
    uR0: { value: 1.3 },
    uR1: { value: 8.5 },
    uRootInv: { value: new THREE.Matrix4() },
  };
  /** Gives a grey tool material the green the pulse paints, from `deep` by the mark to `pale` far out. */
  const litSurface = (m: THREE.MeshPhysicalMaterial, deep: THREE.Color, pale: THREE.Color) => {
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, litU, { uDeep: { value: deep }, uPale: { value: pale } });
      sh.vertexShader = sh.vertexShader
        .replace("#include <common>", "#include <common>\nuniform mat4 uRootInv;\nvarying vec2 vLitXZ;")
        .replace("#include <project_vertex>", "#include <project_vertex>\nvLitXZ = (uRootInv * modelMatrix * vec4(transformed, 1.0)).xz;");
      sh.fragmentShader = sh.fragmentShader
        .replace("#include <common>", "#include <common>\nuniform vec2 uMid; uniform float uRing; uniform float uR0; uniform float uR1; uniform vec3 uDeep; uniform vec3 uPale;\nvarying vec2 vLitXZ;")
        .replace(
          "#include <color_fragment>",
          [
            "#include <color_fragment>",
            "float litD = length(vLitXZ - uMid);",
            "float litK = smoothstep(uR0, uR1, litD);",
            "vec3 litC = mix(uDeep, uPale, litK);",
            // a soft front, a little inside the ring, where the colour comes on
            "float litOn = 1.0 - smoothstep(uRing - 0.55, uRing, litD);",
            "diffuseColor.rgb = mix(diffuseColor.rgb, litC, litOn);",
          ].join("\n"),
        );
    };
    m.customProgramCacheKey = () => "lit-surface";
  };
  let inkMats: THREE.MeshPhysicalMaterial[] = [];
  const PT = {
    /** The tools are laid first, from the outside in, a wave every 0.32s. */
    tools: 0.3,
    pace: 0.32,
    /** Then Ballet lands in the hole they leave, and clicks together, and the pulse runs out from it. */
    mark: 0,
    click: 0,
    /** Every tool is connected, then held, then taken away again, the farthest first. */
    whole: 0,
    hold: 0,
    apart: 0,
    loop: 0,
  };

  if (o.variant === "puzzle") {
    // as far as the wide shot sees, which widens toward the back of the table
    const pieces = field([-6, 6], [-3, 3], (x, y) => Math.abs(y) <= 4.6 && Math.abs(x) <= 6.8 + (y + 4.6) * 0.3);
    const b = 0.024;
    const geos = new Map<string, THREE.BufferGeometry>();
    // a piece lying flat, centred on its own origin, bevelled inside its cut so neighbours meet along it
    // (every tool is cut its own way, so each has its own shape)
    const geometry = (p: FieldPiece, thick: number) => {
      const k = `${p.kind}:${p.part ?? ""}:${p.x},${p.y}`;
      if (!geos.has(k)) {
        const [outer, ...holes] = p.rings.map((r) => r.map(([x, y]) => new THREE.Vector2(x, y)));
        const shape = new THREE.Shape(outer);
        shape.holes = holes.map((h) => new THREE.Path(h));
        const geo = new THREE.ExtrudeGeometry(shape, {
          depth: thick - 2 * b,
          bevelEnabled: true,
          bevelThickness: b,
          bevelSize: b,
          bevelOffset: -b,
          bevelSegments: 2,
        });
        geo.translate(0, 0, -(thick - 2 * b) / 2).rotateX(-Math.PI / 2);
        geos.set(k, geo);
      }
      return geos.get(k)!;
    };
    // the mark's two pieces in two colours, so they read as two: the body in
    // the mark's ink, the bowl in lilac, pale enough to stand clear of the green
    const ink: Record<string, THREE.MeshPhysicalMaterial> = {
      body: clay("#2a1f5e", 0.36),
      bowl: clay("#c7b6f5", 0.4),
    };
    inkMats = Object.values(ink);
    for (const m of inkMats) m.emissive = new THREE.Color("#ffffff");
    // once connected, a tool turns green, deepest beside the mark and fading
    // smoothly out with distance, so the colour reads as spreading from Ballet
    // rather than as one solid shape (the solid inner ring looked like a frog).
    // Its logo is white on the deep greens and green on the pale ones.
    const paper = new THREE.Color(PAL.far);
    const PALE: Tone = { body: paper.clone().lerp(GREEN, 0.2), edge: paper.clone().lerp(GREEN, 0.3).multiplyScalar(0.92), glyph: GREEN.clone().multiplyScalar(0.8) };
    const DEEP: Tone = { body: GREEN.clone(), edge: GREEN.clone().multiplyScalar(PAL.edge), glyph: new THREE.Color("#ffffff") };
    /** The green a tool takes this far from the mark's middle (the same fade the shader paints, uR0 to uR1). */
    const litAt = (d: number): Tone => {
      const u = clamp01((d - litU.uR0.value) / (litU.uR1.value - litU.uR0.value));
      const k = u * u * (3 - 2 * u);
      return {
        body: DEEP.body.clone().lerp(PALE.body, k),
        edge: DEEP.edge.clone().lerp(PALE.edge, k),
        glyph: k < 0.16 ? DEEP.glyph.clone() : GREEN.clone().multiplyScalar(0.5).lerp(PALE.glyph, k * k),
      };
    };
    // each piece a shade lighter or darker than the next, so the seams between them read
    const shade = (t: Tone, k: number): Tone => ({ body: t.body.clone().multiplyScalar(k), edge: t.edge.clone().multiplyScalar(k), glyph: t.glyph });
    // each tool's logo, as a glyph to tint, shared by every piece that carries it
    const decal = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
    const glyphs = o.steps.map((s) => toolFace(s.logo, s.color, redraw));

    // the pulse from the click: a soft green ring running out across the
    // table from the mark's middle, quick at first and slowing as it fades
    const MID: [number, number] = [-0.15, 0.1];
    // till they're connected the tools lie this much further out from the mark than their places, so none touches the next
    const LOOSE = 0.15;
    const PULSE = { from: 1.4, to: 13, dur: PULSE_DUR };
    const pulseAt = (u: number) => PULSE.from + (PULSE.to - PULSE.from) * (1 - Math.pow(1 - clamp01(u), 2));
    /** How long after the click the pulse is this far out. */
    const reached = (d: number) => PULSE.dur * (1 - Math.sqrt(1 - clamp01((d - PULSE.from) / (PULSE.to - PULSE.from))));
    const ringTex = (() => {
      const c = document.createElement("canvas");
      c.width = c.height = 256;
      const g = c.getContext("2d")!;
      const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
      grad.addColorStop(0, "rgba(255,255,255,0)");
      grad.addColorStop(0.8, "rgba(255,255,255,0)");
      grad.addColorStop(0.94, "rgba(255,255,255,1)");
      grad.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = grad;
      g.fillRect(0, 0, 256, 256);
      return new THREE.CanvasTexture(c);
    })();
    const pulse = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ map: ringTex, color: PAL.ring, transparent: true, opacity: 0, depthWrite: false }),
    );
    pulse.position.set(MID[0], THICK + 0.03, -MID[1]);
    pulse.renderOrder = 2;
    pulse.visible = false;
    root.add(pulse);
    pulseRing = { mesh: pulse, at: pulseAt };

    // the mark lands last, the body and then the bowl round its ball, the
    // socket it fits (it wraps under the ball, so it comes down onto it)
    const markIn: Record<string, { from: [number, number, number]; hang: number; dur: number }> = {
      body: { from: [0, 1.7, 0], hang: 0.15, dur: 0.45 },
      bowl: { from: [0.15, 1.5, 0], hang: 0.35, dur: 0.3 },
    };
    const markBits: Record<string, Bit> = {};
    // the mark stands proud of the tools round it
    const markThick = THICK + 0.1;
    const tools = pieces.filter((p) => p.kind === "tool").sort((a, b) => a.reach - b.reach);
    // the logos go out by reach among the pieces that show one, so the best-known sit by the mark
    const faced = tools.filter((t) => t.face);
    const far = Math.max(...tools.map((t) => t.reach));
    let laid = 0;
    for (const p of pieces) {
      const group = new THREE.Group();
      group.rotation.order = "YXZ";
      if (p.kind === "mark") {
        group.add(solid(new THREE.Mesh(geometry(p, markThick), ink[p.part!])));
        root.add(group);
        // and comes apart last, once the tools are gone (see below)
        const back = { body: 0.3, bowl: 0 }[p.part!];
        const m = markIn[p.part!];
        const bit: Bit = { group, home: new THREE.Vector3(0, markThick / 2, 0), from: new THREE.Vector3(...m.from), yaw: 0.35, at: 0, hang: m.hang, dur: m.dur, off: back, mark: true };
        markBits[p.part!] = bit;
        bits.push(bit);
        continue;
      }
      const n = tools.indexOf(p);
      const glyph = p.face && glyphs.length ? glyphs[logoSlot(p, faced.indexOf(p), glyphs.length)] : undefined;
      const body = clay("#dcdbe0", 0.42), edge = clay("#c3c1c9", 0.5);
      litSurface(body, DEEP.body, PALE.body);
      litSurface(edge, DEEP.edge, PALE.edge);
      body.emissive = GREEN.clone();
      body.emissiveIntensity = 0;
      group.add(solid(new THREE.Mesh(geometry(p, THICK), [body, edge])));
      let glyphMat: THREE.MeshStandardMaterial | undefined;
      if (p.face && glyph) {
        glyphMat = new THREE.MeshStandardMaterial({ map: glyph, transparent: true, roughness: 0.5, polygonOffset: true, polygonOffsetFactor: -2 });
        const f = new THREE.Mesh(decal, glyphMat);
        f.scale.setScalar(p.face.size);
        f.position.set(p.face.x, THICK / 2 + 0.002, -p.face.y);
        f.receiveShadow = true;
        group.add(f);
      }
      root.add(group);
      // the farthest first, sweeping round the mark within each wave, so the mark's place is left till last
      const turn = (Math.atan2(p.y, p.x) + Math.PI) / (Math.PI * 2);
      const at = PT.tools + (far - p.reach) * PT.pace + turn * 0.3;
      laid = Math.max(laid, at + 0.45);
      bits.push({
        group,
        home: new THREE.Vector3(p.x, THICK / 2, -p.y),
        from: new THREE.Vector3((scatter(n, 1) - 0.5) * 0.3, 1.1, (scatter(n, 2) - 0.5) * 0.3),
        yaw: (scatter(n, 3) - 0.5) * 0.9,
        at,
        hang: 0,
        dur: 0.42,
        off: far - p.reach,
        mark: false,
        // when it's connected: for now, how far it is from the mark's middle (see below)
        lit: {
          at: Math.hypot(p.x - MID[0], p.y - MID[1]) * (1 + LOOSE),
          to: shade(litAt(Math.hypot(p.x - MID[0], p.y - MID[1])), 0.95 + scatter(n, 4) * 0.08),
          body,
          edge,
          glyph: glyphMat,
          loose: [(p.x - MID[0]) * LOOSE + (scatter(n, 5) - 0.5) * 0.08, -(p.y - MID[1]) * LOOSE + (scatter(n, 6) - 0.5) * 0.08],
          twist: (scatter(n, 7) - 0.5) * 0.16,
        },
      });
    }
    // Ballet, once the tools are all down: the body, then the bowl, the last
    // piece, and the click as it seats; the pulse reaches each tool in turn
    PT.mark = laid + 0.4;
    markBits.body.at = PT.mark;
    markBits.bowl.at = PT.mark + 0.75;
    PT.click = markBits.bowl.at + markBits.bowl.hang + markBits.bowl.dur;
    for (const b of bits) {
      if (!b.lit) continue;
      b.lit.at = PT.click + reached(b.lit.at);
      PT.whole = Math.max(PT.whole, b.lit.at + SNAP + 0.6);
    }
    // now the field's cut, its timings: held for a breath once whole, then
    // taken apart from the outside in, the mark last, before it all starts again
    PT.hold = PT.whole + 1.8;
    PT.apart = PT.hold + far * 0.2 + 0.6;
    PT.loop = PT.apart + 0.3 + 0.5 + 0.4;
    for (const p of bits) p.off = p.mark ? PT.apart + p.off : PT.hold + p.off * 0.2;
  }

  /* ---------- the mark, from its pieces, at an angle ---------- */
  const parts: { mesh: THREE.Mesh; base: THREE.Vector3; out: THREE.Vector3 }[] = [];
  if (o.variant === "mark") {
    const k = 0.0136;
    const mark = new THREE.Group();
    const add = (geo: THREE.BufferGeometry, mat: THREE.Material, out: [number, number, number], at: [number, number]) => {
      const m = solid(new THREE.Mesh(geo, mat));
      m.scale.setScalar(k / 2.6);
      const base = new THREE.Vector3(at[0] * k / 2.6, at[1] * k / 2.6, 0);
      m.position.copy(base);
      mark.add(m);
      parts.push({ mesh: m, base, out: new THREE.Vector3(...out) });
    };
    // placed by their offsets from the ball, in mark units (y up)
    add(upright(MARK.square, 90, 14).translate(-SQUARE.x, SQUARE.y, 0), mats.square, [-0.9, 0.8, 0.5], [SQUARE.x - BALL.x, BALL.y - SQUARE.y]);
    // the neck in the square's colour, as in the mark, set a touch behind its faces
    add(upright(MARK.neck, 46, 12).translate(-NECK.x, NECK.y, 0), mats.square, [-0.35, 0.35, 0.9], [NECK.x - BALL.x, BALL.y - NECK.y]);
    const ballMat = clay(PALETTE.ball, 0.34);
    add(new THREE.SphereGeometry(BALL.r + 10, 48, 32).scale(1, 1, 0.8), ballMat, [0.1, -0.15, 1.1], [0, 0]);
    add(upright(MARK.bowl, 54, 14).translate(-BALL.x, BALL.y, 0), mats.bowl, [0.95, -0.2, -0.4], [0, 0]);
    // leaning back and turned, so its depth shows
    mark.rotation.set(-0.38, -0.42, 0);
    mark.position.y = 1.55;
    root.add(mark);
  }

  /* ---------- camera ---------- */
  const look = new THREE.Vector3();
  /** The puzzle's two shots: close on the mark, and wide on the field it grows. */
  const shots = { wide: { pos: new THREE.Vector3(), look: new THREE.Vector3() }, close: { pos: new THREE.Vector3(), look: new THREE.Vector3() } };
  /** Aims along `dir` at the middle of `box`, then pulls back until all of it is in frame. */
  function fit(box: THREE.Box3, dir: THREE.Vector3) {
    look.copy(box.getCenter(new THREE.Vector3()));
    let dist = 14;
    const corner = new THREE.Vector3();
    for (let pass = 0; pass < 6; pass++) {
      camera.position.copy(look).addScaledVector(dir, dist);
      camera.lookAt(look);
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld();
      let worst = 0;
      for (let c = 0; c < 8; c++) {
        corner.set(c & 1 ? box.max.x : box.min.x, c & 2 ? box.max.y : box.min.y, c & 4 ? box.max.z : box.min.z).project(camera);
        worst = Math.max(worst, Math.abs(corner.x) / 0.97, Math.abs(corner.y) / 0.84);
      }
      dist *= worst;
    }
    camera.position.copy(look).addScaledVector(dir, dist);
  }
  function frame() {
    const w = o.canvas.clientWidth || 800, h = o.canvas.clientHeight || 500;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    if (o.variant === "puzzle") {
      // from the front and well above, as you'd look down at a puzzle on a table
      const dir = new THREE.Vector3(0.08, 1.35, 1).normalize();
      // centred on the mark itself, not its ball
      fit(new THREE.Box3(new THREE.Vector3(-2.6, 0, -1.9), new THREE.Vector3(2.2, 0.3, 1.7)), dir);
      shots.close.pos.copy(camera.position);
      shots.close.look.copy(look);
      // and wide: the rings round the mark, and the field going on past them
      fit(new THREE.Box3(new THREE.Vector3(-6.2, 0, -3.5), new THREE.Vector3(6.0, 0.3, 3.3)), dir);
      shots.wide.pos.copy(camera.position);
      shots.wide.look.copy(look);
    } else if (o.variant === "lattice") {
      // three-quarters on from the right and a little above, so the slab's
      // depth shows and the chain runs back into the page toward its start;
      // pulled back until the whole lattice fits
      const n = pieces.length;
      const top = REACH + 0.02 + D + (STEP / 2 + BEVEL) * K;
      const x1 = (n - 1) * D + (bowl ? REACH : D * 0.7);
      fit(new THREE.Box3(new THREE.Vector3(-D * 0.7, 0, -SLAB), new THREE.Vector3(x1, top + 0.35, SLAB)), new THREE.Vector3(0.42, 0.2, 1).normalize());
    } else {
      camera.position.set(0.6, 2.8, 9.4);
      look.set(0, 1.3, 0);
    }
    camera.lookAt(look);
    camera.updateProjectionMatrix();
  }
  frame();

  /* ---------- the loop: built, run, held, taken apart ---------- */
  const pointer = new THREE.Vector2();
  const lean = new THREE.Vector2();
  const onMove = (e: PointerEvent) => pointer.set((e.clientX / innerWidth) * 2 - 1, (e.clientY / innerHeight) * 2 - 1);
  if (!o.reduced) addEventListener("pointermove", onMove, { passive: true });

  const settled = o.variant === "puzzle" ? PT.whole + 0.6 : o.variant === "lattice" ? T.pass(pieces.length - 1) + 1.0 : 5;
  const states: BlockState[] = pieces.map(() => ({ x: 0, y: 0, shown: 0, done: 0 }));
  const v = new THREE.Vector3();

  function pose(t: number) {
    const loopLen = o.variant === "puzzle" ? PT.loop : T.loop;
    const tau = o.reduced ? settled : o.settle ? Math.min(t, settled) : t % loopLen;
    if (o.variant === "puzzle") {
      // wide on the tools as they're laid, leaning in as Ballet lands among
      // them, and back out as the pulse runs; a small jolt at the click
      const wide = 1 - 0.4 * smooth(PT.mark - 0.6, PT.mark + 0.5, tau) * (1 - smooth(PT.click + 0.15, PT.click + 1.8, tau));
      camera.position.lerpVectors(shots.close.pos, shots.wide.pos, wide);
      look.lerpVectors(shots.close.look, shots.wide.look, wide);
      const sc = tau - PT.click;
      if (sc > 0 && sc < 0.6) camera.position.y -= Math.sin(sc * 34) * Math.exp(-sc * 9) * 0.05;
      camera.lookAt(look);
      // the click: the mark presses down as one, and flashes
      const press = sc > 0 ? Math.sin(Math.min(1, sc / 0.18) * Math.PI) * Math.exp(-sc * 5) : 0;
      for (const m of inkMats) m.emissiveIntensity = sc > 0 ? 0.16 * Math.exp(-sc / 0.1) : 0;
      if (pulseRing) {
        const u = sc / PULSE_DUR;
        // how far out the green has been painted: to the ring, and everywhere once it's gone
        litU.uRing.value = u > 0 ? pulseRing.at(Math.min(1, u)) : 0;
        pulseRing.mesh.visible = u > 0 && u < 1;
        if (pulseRing.mesh.visible) {
          pulseRing.mesh.scale.setScalar(pulseRing.at(u) / 0.94);
          (pulseRing.mesh.material as THREE.MeshBasicMaterial).opacity = 0.8 * Math.pow(1 - u, 1.4);
        }
      }
      for (const p of bits) {
        const g = p.group;
        // it pops into being above its place, squares up, then drops, falling
        // faster as it comes; lifted away again, shrinking, at the end
        const t = tau - p.at;
        const shown = popOut(t / 0.28);
        const a = clamp01((t - p.hang) / p.dur);
        const gone = clamp01((tau - p.off) / 0.45);
        // a tool lies loose, apart from the rest, till the pulse reaches it;
        // then it slides in, lifting a touch as it goes, and locks on
        const c = p.lit ? clamp01((tau - p.lit.at) / SNAP) : 1;
        const join = smooth(0, 1, c);
        g.position.copy(p.home).addScaledVector(p.from, 1 - a * a);
        g.rotation.set(0, p.yaw * (1 - smooth(0, 1, t / (p.hang + p.dur))), 0);
        if (p.lit) {
          g.position.x += p.lit.loose[0] * (1 - join);
          g.position.z += p.lit.loose[1] * (1 - join);
          g.position.y += Math.sin(Math.PI * c) * 0.07;
          g.rotation.y += p.lit.twist * (1 - join);
        }
        // as it lands, and again as it locks on: a squash, and a small rebound
        const s = t - p.hang - p.dur;
        const squash = s > 0 ? Math.sin(Math.min(1, s / 0.16) * Math.PI) * Math.exp(-s * 6) : 0;
        if (s > 0) g.position.y += Math.abs(Math.sin((s / 0.22) * Math.PI)) * Math.exp(-s * 9) * 0.035;
        const lk = p.lit ? tau - p.lit.at - SNAP : -1;
        const lock = lk > 0 ? Math.sin(Math.min(1, lk / 0.14) * Math.PI) * Math.exp(-lk * 6) : 0;
        g.position.y += gone * gone * 0.9;
        const k = Math.max(0.001, shown * (1 - gone * gone));
        const sq = squash * (p.mark ? 0.3 : 0.2) + lock * 0.22 + (p.mark ? press * 0.12 : 0);
        g.scale.set(k * (1 + sq * 0.2), k * (1 - sq), k * (1 + sq * 0.2));
        g.visible = t > 0 && gone < 1;
        // locked on, it's connected: green at once, with a glow that fades as it settles
        if (p.lit) {
          // the colour comes on as the ring passes, while the piece is still
          // sliding in, so the green travels with the pulse rather than behind it
          const l = tau - p.lit.at;
          const on = smooth(0, 0.3, l);
          p.lit.glyph?.color.lerpColors(GREY.glyph, p.lit.to.glyph, on);
          p.lit.body.emissiveIntensity = l > 0 ? 0.5 * Math.exp(-l / 0.22) : 0;
        }
      }
    } else if (o.variant === "lattice") {
      const leave = smooth(9.0, 9.8, tau);
      pieces.forEach((p, i) => {
        // each piece comes forward into its place in turn, and the neck to it with it
        const a = (tau - T.arrive(i)) / 0.6;
        const k = seat(a) * (1 - leave);
        p.group.scale.setScalar(Math.max(0.001, k));
        p.group.position.set(p.home.x, p.home.y, (1 - clamp01(a)) * 0.9 - leave * 0.3);
        p.group.visible = a > 0;
        if (p.neck) {
          p.neck.scale.setScalar(Math.max(0.001, clamp01((a - 0.3) / 0.6) * (1 - leave)));
          p.neck.visible = a > 0.3;
        }
        // the run passes: a system steps forward as it's read or written, a ball glows as Ballet works
        const at = T.pass(i);
        const bump = Math.sin(Math.PI * smooth(at - 0.05, at + 0.45, tau));
        if (p.glow) p.glow.emissiveIntensity = bump * 0.7 + smooth(at, at + 0.3, tau) * 0.12 * (1 - leave);
        else p.group.position.z += bump * 0.14;
        const st = states[i];
        st.shown = clamp01(a) * (1 - leave);
        st.done = smooth(at, at + 0.2, tau) * (1 - smooth(8.7, 9.1, tau));
        // labels: above the upper row, below the lower (and below the bowl, for the last)
        const isLast = bowl && i === pieces.length - 1;
        const dy = p.up ? (STEP / 2 + BEVEL) * K + 0.1 : -(isLast ? REACH + 0.08 : (BALL.r + BEVEL) * K + 0.1);
        v.set(p.home.x, p.home.y + dy, 0).applyMatrix4(root.matrixWorld).project(camera);
        st.x = (v.x + 1) / 2;
        st.y = (1 - v.y) / 2;
      });
      if (bowl) {
        const last = pieces.length - 1;
        const a = (tau - T.arrive(last) - 0.15) / 0.6;
        bowl.scale.setScalar(Math.max(0.001, seat(a) * (1 - leave)));
        bowl.visible = a > 0;
        // and when the run reaches it, the record is kept
        const at = T.pass(last);
        (bowl.material as THREE.MeshPhysicalMaterial).emissiveIntensity = Math.sin(Math.PI * smooth(at, at + 0.8, tau)) * 0.35;
      }
      o.onFrame?.(states);
    } else {
      // apart, then each piece home in turn, then a slow turn together
      parts.forEach((p, i) => {
        const inn = seat((tau - 0.5 - i * 0.32) / 1.0);
        const out = smooth(8.4 + i * 0.12, 9.7, tau);
        const a = Math.max(1 - inn, out);
        p.mesh.position.copy(p.base).addScaledVector(p.out, a * 1.15);
        p.mesh.rotation.z = a * (i % 2 ? 0.35 : -0.35);
      });
    }
    lean.lerp(pointer, 0.05);
    root.rotation.y = lean.x * 0.06 + (o.reduced ? 0 : Math.sin(t * 0.3) * 0.02);
    root.rotation.x = lean.y * 0.015;
    root.updateMatrixWorld();
    litU.uRootInv.value.copy(root.matrixWorld).invert();
  }

  function renderAt(t: number) {
    pose(t);
    renderer.render(scene, camera);
  }

  let req = 0, last = 0;
  function tick(now: number) {
    clock += Math.min(0.05, (now - last) / 1000);
    last = now;
    renderAt(clock);
    if (o.settle && clock >= settled) {
      running = false;
      req = 0;
      return;
    }
    req = requestAnimationFrame(tick);
  }

  const ro = new ResizeObserver(() => {
    frame();
    redraw();
  });
  ro.observe(o.canvas);
  // every loop starts from an empty table, so the puzzle is seen put together
  // from the first tool; the first loop starts as that tool is laid, not 0.3s
  // before it, so there's no pause after the scene appears
  clock = o.variant === "puzzle" ? PT.tools : 0;
  renderAt(o.reduced ? settled : clock);

  return {
    settled,
    resize: frame,
    setActive(on) {
      if (on === running || o.reduced) return;
      running = on;
      if (on) {
        last = performance.now();
        req = requestAnimationFrame(tick);
      } else cancelAnimationFrame(req);
    },
    renderAt(t) {
      clock = t;
      renderAt(t);
    },
    dispose() {
      cancelAnimationFrame(req);
      removeEventListener("pointermove", onMove);
      ro.disconnect();
      renderer.dispose();
    },
    // in development only, the scene's insides, for posing stills by hand
    ...(import.meta.env.DEV ? { debug: { bits, grey: GREY, pose, draw: () => renderer.render(scene, camera), camera, THREE, scene, renderer, litU } } : {}),
  };
}
