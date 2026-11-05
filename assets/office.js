import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

const canvas = document.getElementById("c");
const loaderEl = document.getElementById("loader");
const loaderBar = document.getElementById("loader-bar");
const hintEl = document.getElementById("hint");
const hotspotsEl = document.getElementById("hotspots");
const panelEl = document.getElementById("panel");
const panelBody = document.getElementById("panel-body");
const resumeSheet = document.getElementById("resume-sheet");
const resumeFrame = document.getElementById("resume-frame");
const downloadModal = document.getElementById("download-modal");

const CONTENT = {
  about: {
    title: "About me",
    html: `
      <p>Engineering leader for SASE, Zero Trust, and network delivery — 12+ years across Extreme Networks, Cisco, Ruckus, and Palo Alto platforms.</p>
      <p>Currently leading network platform architecture for Ford Blue Oval Michigan: Prisma Access, IoT Security, Cortex XSOAR, and Strata Cloud Manager.</p>
      <div class="panel-actions">
        <a class="chip" href="mailto:tufayl@outlook.com">Email</a>
        <a class="chip" href="https://github.com/TufaylAhmed" target="_blank" rel="noopener">GitHub</a>
      </div>`,
  },
  rack: {
    title: "Network rack",
    html: `
      <p>A living slice of the stack I design and deliver:</p>
      <ul>
        <li><strong>Palo Alto</strong> — Prisma Access / NGFW edge, policy, Zero Trust</li>
        <li><strong>Cortex XSOAR</strong> — automation &amp; response</li>
        <li><strong>Switching</strong> — campus / DC fabric connectivity</li>
        <li><strong>Wireless / edge</strong> — Ruckus &amp; Extreme heritage</li>
      </ul>
      <div class="panel-actions">
        <button type="button" class="chip solid" data-go="resume">Open resume</button>
      </div>`,
  },
  monitors: {
    title: "Workstation",
    html: `
      <p>Where delivery plans, architecture reviews, and observability work come together — APIs, telemetry, and SASE programmes across US, EMEA, and APAC.</p>
      <div class="panel-actions">
        <a class="chip" href="https://github.com/TufaylAhmed" target="_blank" rel="noopener">View GitHub</a>
      </div>`,
  },
  github: {
    title: "GitHub",
    html: `
      <p>Experiments, tools, and profile source.</p>
      <div class="panel-actions">
        <a class="chip solid" href="https://github.com/TufaylAhmed" target="_blank" rel="noopener">github.com/TufaylAhmed</a>
      </div>`,
  },
};

const state = {
  focus: null,
  animating: false,
  resumeOpen: false,
};

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
  powerPreference: "high-performance",
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x141a16);
scene.fog = new THREE.Fog(0x141a16, 12, 28);

const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(4.8, 3.4, 6.2);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 3.2;
controls.maxDistance = 11;
controls.minPolarAngle = 0.35;
controls.maxPolarAngle = Math.PI * 0.48;
controls.target.set(0.2, 1.15, -0.4);
controls.update();

const defaultCam = {
  position: camera.position.clone(),
  target: controls.target.clone(),
};

const clock = new THREE.Clock();
const interactive = [];
const hotspotDefs = [];
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const texLoader = new THREE.TextureLoader();

function setProgress(p) {
  loaderBar.style.width = `${Math.round(p * 100)}%`;
}

function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness ?? 0.55,
    metalness: opts.metalness ?? 0.05,
    emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.emissiveIntensity ?? 0,
    ...opts,
  });
}

function addShadow(mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function makeLabelTexture(lines, opts = {}) {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 256;
  const g = c.getContext("2d");
  g.fillStyle = opts.bg || "#0b1220";
  g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = opts.fg || "#9ad0ff";
  g.font = opts.font || "bold 28px monospace";
  lines.forEach((line, i) => g.fillText(line, 24, 56 + i * 36));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function createRoom(officeTex) {
  const room = new THREE.Group();
  room.name = "room";

  // Floor
  const floor = addShadow(
    new THREE.Mesh(
      new THREE.PlaneGeometry(10, 10),
      mat(0x5a3424, { roughness: 0.7, metalness: 0.05 })
    )
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  room.add(floor);

  // Wood plank lines
  for (let i = -5; i <= 5; i++) {
    const line = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 0.02),
      mat(0x3d2218, { roughness: 1 })
    );
    line.rotation.x = -Math.PI / 2;
    line.position.set(0, 0.002, i);
    room.add(line);
  }

  // Walls
  const wallMat = mat(0x2a312c, { roughness: 0.92 });
  const back = addShadow(new THREE.Mesh(new THREE.BoxGeometry(10, 4.2, 0.18), wallMat));
  back.position.set(0, 2.1, -4.2);
  room.add(back);
  const left = addShadow(new THREE.Mesh(new THREE.BoxGeometry(0.18, 4.2, 8.4), wallMat));
  left.position.set(-4.2, 2.1, 0);
  room.add(left);

  // Rug
  const rug = addShadow(
    new THREE.Mesh(
      new THREE.PlaneGeometry(3.4, 2.4),
      mat(0x6e2b28, { roughness: 0.95 })
    )
  );
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(0.6, 0.01, 1.5);
  room.add(rug);
  const rugBorder = new THREE.Mesh(
    new THREE.PlaneGeometry(3.1, 2.1),
    mat(0xd9c5a0, { roughness: 0.95 })
  );
  rugBorder.rotation.x = -Math.PI / 2;
  rugBorder.position.set(0.6, 0.012, 1.5);
  room.add(rugBorder);
  const rugCenter = new THREE.Mesh(
    new THREE.PlaneGeometry(2.5, 1.5),
    mat(0x4a1f1c, { roughness: 0.95 })
  );
  rugCenter.rotation.x = -Math.PI / 2;
  rugCenter.position.set(0.6, 0.014, 1.5);
  room.add(rugCenter);

  // Window blinds on right implied by light — framed office photo on wall
  const frame = addShadow(
    new THREE.Mesh(new RoundedBoxGeometry(1.35, 1.8, 0.08, 2, 0.02), mat(0x1b1714, { roughness: 0.4 }))
  );
  frame.position.set(-3.95, 2.15, -1.1);
  frame.rotation.y = Math.PI / 2;
  room.add(frame);
  const photo = new THREE.Mesh(
    new THREE.PlaneGeometry(1.2, 1.6),
    new THREE.MeshBasicMaterial({ map: officeTex })
  );
  photo.position.set(-3.9, 2.15, -1.1);
  photo.rotation.y = Math.PI / 2;
  room.add(photo);

  return room;
}

function createDesk() {
  const desk = new THREE.Group();
  desk.name = "desk";

  const top = addShadow(
    new THREE.Mesh(new RoundedBoxGeometry(3.6, 0.1, 1.05, 2, 0.02), mat(0x4a2c1d, { roughness: 0.45 }))
  );
  top.position.set(0, 1.05, -1.55);
  desk.add(top);

  // Legs / pedestal
  const pedestal = addShadow(
    new THREE.Mesh(new RoundedBoxGeometry(3.4, 0.95, 0.7, 2, 0.02), mat(0x3a2418, { roughness: 0.55 }))
  );
  pedestal.position.set(0, 0.52, -1.65);
  desk.add(pedestal);

  // Shelf unit
  const shelf = addShadow(
    new THREE.Mesh(new RoundedBoxGeometry(3.5, 1.7, 0.35, 2, 0.02), mat(0x3f281c, { roughness: 0.5 }))
  );
  shelf.position.set(0, 2.0, -2.0);
  desk.add(shelf);

  for (let y of [1.45, 1.9, 2.35, 2.75]) {
    const board = addShadow(
      new THREE.Mesh(new THREE.BoxGeometry(3.35, 0.04, 0.32), mat(0x5a3826))
    );
    board.position.set(0, y, -2.0);
    desk.add(board);
  }

  // Books
  for (let i = 0; i < 18; i++) {
    const book = addShadow(
      new THREE.Mesh(
        new THREE.BoxGeometry(0.12 + Math.random() * 0.05, 0.28 + Math.random() * 0.1, 0.22),
        mat(new THREE.Color().setHSL(0.05 + Math.random() * 0.08, 0.35, 0.25 + Math.random() * 0.2))
      )
    );
    book.position.set(-1.45 + i * 0.17, 1.62, -2.0);
    desk.add(book);
  }

  // Monitors
  const screenTex = makeLabelTexture(
    ["SASE DELIVERY", "Prisma · XSOAR", "telemetry pipeline", "roadmap · KPIs"],
    { bg: "#071018", fg: "#8ec7ff" }
  );
  const screenTex2 = makeLabelTexture(
    ["network graph", "BGP · OSPF", "gNMI streams", "SLO burn"],
    { bg: "#0a1018", fg: "#9dffe0", font: "bold 26px monospace" }
  );

  function monitor(x, tex, scale = 1) {
    const g = new THREE.Group();
    const bezel = addShadow(
      new THREE.Mesh(new RoundedBoxGeometry(1.05 * scale, 0.65 * scale, 0.05, 2, 0.01), mat(0x111111, { roughness: 0.35 }))
    );
    g.add(bezel);
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.95 * scale, 0.55 * scale),
      new THREE.MeshStandardMaterial({
        map: tex,
        emissive: 0x224466,
        emissiveIntensity: 0.55,
        roughness: 0.3,
        metalness: 0.1,
      })
    );
    screen.position.z = 0.03;
    g.add(screen);
    const stand = addShadow(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.28, 12), mat(0x222222)));
    stand.position.y = -0.45 * scale;
    g.add(stand);
    const base = addShadow(new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.03, 16), mat(0x222222)));
    base.position.y = -0.58 * scale;
    g.add(base);
    g.position.set(x, 1.55, -1.35);
    return g;
  }

  const m1 = monitor(-0.15, screenTex, 1.05);
  const m2 = monitor(-1.15, screenTex2, 0.85);
  m2.rotation.y = 0.18;
  desk.add(m1, m2);
  m1.userData = { id: "monitors", focus: new THREE.Vector3(-0.2, 1.55, -1.35) };
  interactive.push(m1);

  // Laptop
  const laptop = new THREE.Group();
  const baseL = addShadow(new THREE.Mesh(new RoundedBoxGeometry(0.55, 0.02, 0.38, 2, 0.01), mat(0x2a2a2a, { metalness: 0.4, roughness: 0.35 })));
  laptop.add(baseL);
  const lid = addShadow(new THREE.Mesh(new RoundedBoxGeometry(0.55, 0.36, 0.02, 2, 0.01), mat(0x1a1a1a)));
  lid.position.set(0, 0.18, -0.18);
  lid.rotation.x = -0.2;
  laptop.add(lid);
  laptop.position.set(0.15, 1.13, -1.25);
  desk.add(laptop);

  // Lamp
  const lamp = new THREE.Group();
  const arm = addShadow(new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.55, 10), mat(0xcfc3a8)));
  arm.position.set(0, 0.28, 0);
  lamp.add(arm);
  const shade = addShadow(
    new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.18, 20, 1, true), mat(0xe8dcc0, { roughness: 0.85 }))
  );
  shade.position.y = 0.55;
  lamp.add(shade);
  const bulb = new THREE.PointLight(0xffd2a8, 18, 5, 2);
  bulb.position.y = 0.48;
  bulb.castShadow = true;
  lamp.add(bulb);
  lamp.position.set(1.35, 1.12, -1.35);
  desk.add(lamp);

  // Resume stack on desk — interactive
  const resume = new THREE.Group();
  resume.name = "resume";
  for (let i = 0; i < 3; i++) {
    const page = addShadow(
      new THREE.Mesh(
        new RoundedBoxGeometry(0.42, 0.01, 0.58, 1, 0.004),
        mat(i === 2 ? 0xf7f2e8 : 0xece5d8, { roughness: 0.85 })
      )
    );
    page.position.y = i * 0.012;
    page.rotation.y = (i - 1) * 0.04;
    resume.add(page);
  }
  // Title strip
  const title = new THREE.Mesh(
    new THREE.PlaneGeometry(0.34, 0.08),
    new THREE.MeshBasicMaterial({
      map: makeLabelTexture(["RESUME", "Tufail Ahmed Sheikh"], {
        bg: "#f7f2e8",
        fg: "#2a2018",
        font: "bold 34px Georgia",
      }),
    })
  );
  title.rotation.x = -Math.PI / 2;
  title.position.set(0, 0.04, -0.12);
  resume.add(title);

  // Glow ring
  const glow = new THREE.PointLight(0xffc38a, 2.5, 1.8, 2);
  glow.position.set(0, 0.2, 0);
  resume.add(glow);

  resume.position.set(1.0, 1.12, -1.2);
  resume.userData = {
    id: "resume",
    focus: new THREE.Vector3(1.0, 1.25, -1.15),
  };
  desk.add(resume);
  interactive.push(resume);

  hotspotDefs.push({
    id: "resume",
    label: "Resume",
    object: resume,
    offset: new THREE.Vector3(0, 0.35, 0),
  });
  hotspotDefs.push({
    id: "monitors",
    label: "Workstation",
    object: m1,
    offset: new THREE.Vector3(0, 0.55, 0),
  });

  return desk;
}

function createChair() {
  const chair = new THREE.Group();
  const seat = addShadow(
    new THREE.Mesh(new RoundedBoxGeometry(0.55, 0.08, 0.55, 2, 0.03), mat(0x111111))
  );
  seat.position.y = 0.72;
  chair.add(seat);
  const back = addShadow(
    new THREE.Mesh(new RoundedBoxGeometry(0.55, 0.7, 0.08, 2, 0.03), mat(0x111111))
  );
  back.position.set(0, 1.12, -0.24);
  chair.add(back);
  const accent = addShadow(
    new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.7, 0.09), mat(0xb91c1c, { roughness: 0.4 }))
  );
  accent.position.set(0.24, 1.12, -0.24);
  chair.add(accent);
  const base = addShadow(new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.3, 0.05, 16), mat(0x222222, { metalness: 0.6, roughness: 0.35 })));
  base.position.y = 0.35;
  chair.add(base);
  for (let i = 0; i < 5; i++) {
    const leg = addShadow(new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.04, 0.05), mat(0x333333, { metalness: 0.7 })));
    leg.position.set(0, 0.33, 0);
    leg.rotation.y = (i / 5) * Math.PI * 2;
    chair.add(leg);
  }
  chair.position.set(0.1, 0, -0.35);
  chair.rotation.y = 0.25;
  return chair;
}

function createRack() {
  const rack = new THREE.Group();
  rack.name = "rack";

  // Cabinet
  const cabinet = addShadow(
    new THREE.Mesh(new RoundedBoxGeometry(0.72, 2.15, 0.85, 2, 0.02), mat(0x1a1d22, { metalness: 0.35, roughness: 0.45 }))
  );
  cabinet.position.y = 1.075;
  rack.add(cabinet);

  // Rails
  [-0.28, 0.28].forEach((x) => {
    const rail = addShadow(new THREE.Mesh(new THREE.BoxGeometry(0.03, 1.9, 0.03), mat(0x666b73, { metalness: 0.8, roughness: 0.3 })));
    rail.position.set(x, 1.1, 0.38);
    rack.add(rail);
  });

  function unit(y, color, labelLines, accent = 0xff6a00) {
    const u = new THREE.Group();
    const body = addShadow(
      new THREE.Mesh(new RoundedBoxGeometry(0.58, 0.16, 0.7, 1, 0.01), mat(color, { metalness: 0.25, roughness: 0.4 }))
    );
    u.add(body);
    const face = new THREE.Mesh(
      new THREE.PlaneGeometry(0.54, 0.12),
      new THREE.MeshStandardMaterial({
        map: makeLabelTexture(labelLines, { bg: "#111418", fg: "#f0f3f7", font: "bold 34px Helvetica" }),
        roughness: 0.4,
        metalness: 0.2,
      })
    );
    face.position.set(0, 0, 0.36);
    u.add(face);
    const led = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.015, 0.01),
      mat(accent, { emissive: accent, emissiveIntensity: 0.9, roughness: 0.2 })
    );
    led.position.set(0, 0.055, 0.355);
    u.add(led);
    // ports
    for (let i = 0; i < 8; i++) {
      const port = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.03, 0.02), mat(0x0a0a0a));
      port.position.set(-0.2 + i * 0.055, -0.03, 0.36);
      u.add(port);
    }
    u.position.y = y;
    return u;
  }

  rack.add(unit(1.85, 0xf2f2f2, ["PALO ALTO", "PA-3220 NGFW"], 0xff5a1f));
  rack.add(unit(1.62, 0xe8e8e8, ["PRISMA", "SASE EDGE"], 0xff7a3d));
  rack.add(unit(1.39, 0x1a1f28, ["CORTEX XSOAR", "SOAR NODE"], 0x00c0e8));
  rack.add(unit(1.16, 0x0f3d66, ["CISCO", "CATALYST"], 0x1ba0d7));
  rack.add(unit(0.93, 0x2a1438, ["EXTREME", "FABRIC"], 0x9b4dca));
  rack.add(unit(0.70, 0x2b2b2b, ["RUCKUS", "SMARTZONE"], 0xf15a22));
  rack.add(unit(0.47, 0x222222, ["PATCH", "PANEL 24P"], 0x88ff88));

  // Door glass hint
  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(0.62, 1.95),
    new THREE.MeshPhysicalMaterial({
      color: 0x88aacc,
      transparent: true,
      opacity: 0.08,
      roughness: 0.1,
      metalness: 0.0,
      transmission: 0.6,
    })
  );
  glass.position.set(0, 1.1, 0.44);
  rack.add(glass);

  const rackLight = new THREE.PointLight(0xff7a3d, 4, 3.5, 2);
  rackLight.position.set(0, 1.8, 0.6);
  rack.add(rackLight);

  rack.position.set(-2.35, 0, -1.4);
  rack.userData = {
    id: "rack",
    focus: new THREE.Vector3(-2.35, 1.3, -1.2),
  };
  interactive.push(rack);

  hotspotDefs.push({
    id: "rack",
    label: "Network rack",
    object: rack,
    offset: new THREE.Vector3(0, 2.35, 0.2),
  });

  return rack;
}

function createGithubFrame() {
  const frame = new THREE.Group();
  const board = addShadow(
    new THREE.Mesh(new RoundedBoxGeometry(0.7, 0.7, 0.06, 2, 0.02), mat(0x111111))
  );
  frame.add(board);
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(0.55, 0.55),
    new THREE.MeshBasicMaterial({
      map: makeLabelTexture(["GitHub", "TufaylAhmed"], { bg: "#0d1117", fg: "#f0f6fc", font: "bold 48px Helvetica" }),
    })
  );
  face.position.z = 0.04;
  frame.add(face);
  frame.position.set(-3.95, 1.35, 0.5);
  frame.rotation.y = Math.PI / 2;
  frame.userData = { id: "github", focus: new THREE.Vector3(-3.2, 1.35, 0.5) };
  interactive.push(frame);
  hotspotDefs.push({
    id: "github",
    label: "GitHub",
    object: frame,
    offset: new THREE.Vector3(0.2, 0.45, 0),
  });
  return frame;
}

function createAboutPlant() {
  // Corner plant + hotspot for about
  const g = new THREE.Group();
  const pot = addShadow(new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.14, 0.25, 16), mat(0x3d2a20)));
  pot.position.y = 0.125;
  g.add(pot);
  const leafMat = mat(0x2f6b3a, { roughness: 0.8 });
  for (let i = 0; i < 8; i++) {
    const leaf = addShadow(new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), leafMat));
    leaf.scale.set(1, 0.55, 1.3);
    leaf.position.set(Math.cos((i / 8) * Math.PI * 2) * 0.12, 0.4 + (i % 3) * 0.08, Math.sin((i / 8) * Math.PI * 2) * 0.12);
    g.add(leaf);
  }
  g.position.set(2.6, 0, 1.8);
  g.userData = { id: "about", focus: new THREE.Vector3(2.2, 1.2, 1.5) };
  interactive.push(g);
  hotspotDefs.push({
    id: "about",
    label: "About me",
    object: g,
    offset: new THREE.Vector3(0, 0.95, 0),
  });
  return g;
}

function createHotspotButtons() {
  hotspotDefs.forEach((def) => {
    const btn = document.createElement("button");
    btn.className = "hotspot";
    btn.type = "button";
    btn.textContent = def.label;
    btn.dataset.id = def.id;
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      focusObject(def.id);
    });
    hotspotsEl.appendChild(btn);
    def.el = btn;
  });
}

function updateHotspots() {
  hotspotDefs.forEach((def) => {
    const world = new THREE.Vector3().copy(def.offset);
    def.object.localToWorld(world);
    world.project(camera);
    const x = (world.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-world.y * 0.5 + 0.5) * window.innerHeight;
    const visible = world.z < 1;
    def.el.style.display = visible ? "block" : "none";
    def.el.style.left = `${x}px`;
    def.el.style.top = `${y}px`;
  });
}

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function animateCamera(toPos, toTarget, duration = 1.1) {
  return new Promise((resolve) => {
    state.animating = true;
    controls.enabled = false;
    const fromPos = camera.position.clone();
    const fromTarget = controls.target.clone();
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / (duration * 1000));
      const e = easeInOut(t);
      camera.position.lerpVectors(fromPos, toPos, e);
      controls.target.lerpVectors(fromTarget, toTarget, e);
      controls.update();
      if (t < 1) requestAnimationFrame(tick);
      else {
        state.animating = false;
        controls.enabled = true;
        resolve();
      }
    };
    requestAnimationFrame(tick);
  });
}

function openPanel(id) {
  const data = CONTENT[id];
  if (!data) return;
  panelBody.innerHTML = `<h2>${data.title}</h2>${data.html}`;
  panelEl.hidden = false;
  panelBody.querySelectorAll("[data-go]").forEach((btn) => {
    btn.addEventListener("click", () => focusObject(btn.getAttribute("data-go")));
  });
}

function closePanel() {
  panelEl.hidden = true;
}

async function focusObject(id) {
  hintEl.classList.add("hide");
  const obj = interactive.find((o) => o.userData.id === id);
  if (!obj) return;

  if (id === "resume") {
    await openResume();
    return;
  }

  const focus = obj.userData.focus || obj.position.clone();
  const dir = new THREE.Vector3(1.4, 1.1, 1.8).normalize();
  if (id === "rack") dir.set(1.6, 0.6, 1.3).normalize();
  if (id === "github") dir.set(1.2, 0.3, 0.2).normalize();
  if (id === "about") dir.set(-1.2, 0.8, 1.0).normalize();
  const camPos = focus.clone().add(dir.multiplyScalar(id === "rack" ? 2.4 : 2.8));
  await animateCamera(camPos, focus, 1.05);
  openPanel(id);
  state.focus = id;
}

async function openResume() {
  const resumeObj = interactive.find((o) => o.userData.id === "resume");
  const focus = resumeObj.userData.focus.clone();
  const camPos = focus.clone().add(new THREE.Vector3(0.15, 0.85, 1.55));
  await animateCamera(camPos, focus, 0.95);
  // Lift resume slightly
  resumeObj.position.y = 1.22;
  state.resumeOpen = true;
  resumeFrame.src = "/api/storage/Tufail_Ahmed_Sheikh_Resume.pdf#toolbar=0";
  // Note: storage is denied by htaccess for direct access - need a preview endpoint
  // Use gated preview via temporary approach: show panel + download, or serve via download with token after email
  // Better: create preview.php that streams PDF for embed OR unlock storage for GET with referer
  // For now use a public preview copy
  resumeFrame.src = "/assets/Tufail_Ahmed_Sheikh_Resume.pdf#view=FitH";
  resumeSheet.hidden = false;
  closePanel();
}

function putBackResume() {
  resumeSheet.hidden = true;
  resumeFrame.src = "about:blank";
  const resumeObj = interactive.find((o) => o.userData.id === "resume");
  if (resumeObj) resumeObj.position.y = 1.12;
  state.resumeOpen = false;
  resetView();
}

async function resetView() {
  closePanel();
  putBackResumeQuiet();
  await animateCamera(defaultCam.position, defaultCam.target, 1);
  state.focus = null;
}

function putBackResumeQuiet() {
  resumeSheet.hidden = true;
  resumeFrame.src = "about:blank";
  const resumeObj = interactive.find((o) => o.userData.id === "resume");
  if (resumeObj) resumeObj.position.y = 1.12;
  state.resumeOpen = false;
}

function onPointer(event) {
  if (state.animating || state.resumeOpen) return;
  const rect = canvas.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(interactive, true);
  if (!hits.length) return;
  let obj = hits[0].object;
  while (obj && !obj.userData?.id) obj = obj.parent;
  if (obj?.userData?.id) focusObject(obj.userData.id);
}

function onMove(event) {
  const rect = canvas.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(interactive, true);
  canvas.style.cursor = hits.length ? "pointer" : "grab";
}

// Lights
const hemi = new THREE.HemisphereLight(0xdde6ff, 0x2a1a12, 0.55);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffe2c4, 1.35);
sun.position.set(4, 7, 3);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 20;
sun.shadow.camera.left = -6;
sun.shadow.camera.right = 6;
sun.shadow.camera.top = 6;
sun.shadow.camera.bottom = -6;
scene.add(sun);
const fill = new THREE.DirectionalLight(0x8eb6ff, 0.25);
fill.position.set(-4, 3, 2);
scene.add(fill);

// UI wiring
document.getElementById("panel-close").addEventListener("click", closePanel);
document.getElementById("btn-reset").addEventListener("click", resetView);
document.getElementById("resume-close").addEventListener("click", putBackResume);
document.getElementById("btn-download").addEventListener("click", () => {
  downloadModal.hidden = false;
});
document.querySelectorAll("[data-close-dl]").forEach((el) =>
  el.addEventListener("click", () => {
    downloadModal.hidden = true;
  })
);

const dlForm = document.getElementById("dl-form");
const dlStatus = document.getElementById("dl-status");
const dlSubmit = document.getElementById("dl-submit");
dlForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  dlStatus.textContent = "";
  dlStatus.className = "form-status";
  const data = new FormData(dlForm);
  dlSubmit.disabled = true;
  dlSubmit.textContent = "Preparing…";
  try {
    const res = await fetch("/api/request-resume.php", {
      method: "POST",
      headers: { Accept: "application/json" },
      body: data,
    });
    const payload = await res.json();
    if (!res.ok || !payload.ok) throw new Error(payload.error || "Failed");
    dlStatus.textContent = "Download starting…";
    dlStatus.classList.add("ok");
    const a = document.createElement("a");
    a.href = payload.downloadUrl;
    a.download = payload.filename || "resume.pdf";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => {
      downloadModal.hidden = true;
    }, 700);
  } catch (err) {
    dlStatus.textContent = err.message || "Something went wrong";
    dlStatus.classList.add("error");
  } finally {
    dlSubmit.disabled = false;
    dlSubmit.textContent = "Download PDF";
  }
});

// Mobile note
const mobileNote = document.getElementById("mobile-note");
if (window.matchMedia("(max-width: 720px)").matches) {
  mobileNote.hidden = false;
}
document.getElementById("mobile-continue").addEventListener("click", () => {
  mobileNote.hidden = true;
});
document.getElementById("mobile-resume").addEventListener("click", () => {
  mobileNote.hidden = true;
  downloadModal.hidden = false;
});

canvas.addEventListener("pointerdown", () => {
  canvas.style.cursor = "grabbing";
});
canvas.addEventListener("pointerup", onPointer);
canvas.addEventListener("pointermove", onMove);

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

async function init() {
  setProgress(0.15);
  const officeTex = await new Promise((resolve, reject) => {
    texLoader.load(
      "/assets/textures/office.jpg",
      (t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        resolve(t);
      },
      (ev) => {
        if (ev.total) setProgress(0.15 + 0.4 * (ev.loaded / ev.total));
      },
      reject
    );
  });
  setProgress(0.6);

  scene.add(createRoom(officeTex));
  scene.add(createDesk());
  scene.add(createChair());
  scene.add(createRack());
  scene.add(createGithubFrame());
  scene.add(createAboutPlant());
  createHotspotButtons();
  setProgress(1);

  // Copy resume to public assets for iframe preview
  // (deployed separately)

  setTimeout(() => loaderEl.classList.add("done"), 280);

  function animate() {
    const t = clock.getElapsedTime();
    // Subtle resume glow pulse
    const resumeObj = interactive.find((o) => o.userData.id === "resume");
    if (resumeObj && !state.resumeOpen) {
      const light = resumeObj.children.find((c) => c.isLight);
      if (light) light.intensity = 1.8 + Math.sin(t * 2.2) * 0.8;
      resumeObj.rotation.y = Math.sin(t * 0.7) * 0.03;
    }
    const rack = interactive.find((o) => o.userData.id === "rack");
    if (rack) {
      rack.children.forEach((ch) => {
        if (ch.isGroup) {
          const led = ch.children.find(
            (c) => c.material && c.material.emissiveIntensity !== undefined && c.geometry?.parameters?.height === 0.015
          );
          // skip complex; pulse rack point light
        }
      });
      const rl = rack.children.find((c) => c.isLight);
      if (rl) rl.intensity = 3.2 + Math.sin(t * 3) * 0.8;
    }
    controls.update();
    updateHotspots();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();
}

init().catch((err) => {
  console.error(err);
  loaderEl.innerHTML = `<div class="loader-card"><h1>Could not load the office</h1><p style="color:#ccc">${err.message}</p></div>`;
});
