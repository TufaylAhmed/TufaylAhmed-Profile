import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { TDSLoader } from "three/addons/loaders/TDSLoader.js";

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

const RESUME_PDF = "/assets/Tufail_Ahmed_Sheikh_Resume.pdf";

const CONTENT = {
  about: {
    title: "About me",
    html: `
      <p>Engineering leader for SASE, Zero Trust, and network delivery — 12+ years across Extreme Networks, Cisco, Ruckus, and Palo Alto platforms.</p>
      <p>Currently leading network platform architecture for Ford Blue Oval Michigan: Prisma Access, IoT Security, Cortex XSOAR, and Strata Cloud Manager.</p>
      <div class="panel-actions">
        <button type="button" class="chip solid" data-go="resume">Open resume</button>
        <a class="chip" href="mailto:tufayl@outlook.com">Email</a>
      </div>`,
  },
  rack: {
    title: "Network rack",
    html: `
      <p>Live demo gear — click a device face or use the menu:</p>
      <ul>
        <li><strong>Palo Alto PA-3220</strong> NGFW</li>
        <li><strong>Cisco Catalyst 9300</strong> switch</li>
        <li><strong>Extreme 7520</strong> fabric</li>
        <li>Patch panel · patch cables</li>
      </ul>
      <div class="panel-actions">
        <button type="button" class="chip solid" data-go="console">Open console</button>
        <button type="button" class="chip" data-go="cables">Toggle cables</button>
        <button type="button" class="chip" data-go="resume">Resume</button>
      </div>`,
  },
  monitors: {
    title: "Workstation",
    html: `
      <p>Architecture, delivery plans, and observability work live here. Open <strong>Resume</strong> to put the CV on this monitor and read it.</p>
      <div class="panel-actions">
        <button type="button" class="chip solid" data-go="resume">Show resume</button>
      </div>`,
  },
  github: {
    title: "GitHub",
    html: `
      <p>Code, experiments, and this office source.</p>
      <div class="panel-actions">
        <a class="chip solid" href="https://github.com/TufaylAhmed" target="_blank" rel="noopener">github.com/TufaylAhmed</a>
      </div>`,
  },
  chair: {
    title: "Okamura Atlas",
    html: `
      <p>Black mesh task chair with a red back profile. Click the chair to roll it, or click the floor to park it.</p>
      <div class="panel-actions">
        <button type="button" class="chip solid" data-go="chair-roll">Roll chair</button>
      </div>`,
  },
};

const state = {
  focus: null,
  animating: false,
  resumeOpen: false,
  cablesOn: true,
  activeDevice: "pa-3220",
  chairMoveMode: false,
};

const DEVICES = {
  "pa-3220": {
    title: "admin@pa-3220",
    prompt: "admin@pa-3220>",
    banner: [
      "Palo Alto Networks PA-3220 series firewall",
      "Hostname: pa-3220-bom",
      "Model: PA-3220    Serial: 012345678901",
      "Software: 11.1.2",
      "------------------------------------------------",
      "Type 'help' for demo commands.",
    ],
    cmds: {
      help: "Commands: show system info | show interface all | show session info | show routing route | ping | clear | exit",
      "show system info": "hostname: pa-3220-bom\nip-address: 10.10.10.1/24\nuptime: 42 days, 03:11:08\noperational-mode: normal\nmulti-vsys: off\ndevice-certificate-status: Valid",
      "show interface all": "name     id    speed/duplex/state      mac\nethernet1/1  16  10G/full/up           08:66:da:11:22:01\nethernet1/2  17  10G/full/up           08:66:da:11:22:02\nethernet1/3  18  1G/full/up            08:66:da:11:22:03\ntunnel.1     50  n/a/n/a/up            n/a",
      "show session info": "Number of sessions supported:                   1000000\nNumber of active sessions:                          1842\nPacket rate:                                      22140/s\nThroughput:                                       1.8 Gbps\nNew connection establish rate:                     312/s",
      "show routing route": "flags: A:active, ?:loose, C:connect, H:host, S:static, ~:internal\n\nVIRTUAL ROUTER: default (id 1)\n==========\ndestination       nexthop         metric flags interface\n0.0.0.0/0         10.10.10.254    10     A S    ethernet1/1\n10.10.10.0/24     10.10.10.1      0      A C    ethernet1/1\n10.20.0.0/16      10.10.10.2      10     A S    ethernet1/2",
      ping: "PING 8.8.8.8 (8.8.8.8) 56 data bytes\n64 bytes from 8.8.8.8: icmp_seq=1 ttl=117 time=12.4 ms\n64 bytes from 8.8.8.8: icmp_seq=2 ttl=117 time=11.9 ms\n--- 8.8.8.8 ping statistics ---\n2 packets transmitted, 2 received, 0% packet loss",
    },
  },
  "cisco-9300": {
    title: "admin@sw-core-01",
    prompt: "sw-core-01#",
    banner: [
      "Cisco IOS XE Software, Catalyst 9300",
      "Switch Ports Model              SW Version",
      "------ ----- -----              ----------",
      "*1     48    C9300-48U          17.09.04a",
      "------------------------------------------------",
      "Type 'help' for demo commands.",
    ],
    cmds: {
      help: "Commands: show ip int brief | show vlan brief | show mac address-table | show cdp neighbors | clear | exit",
      "show ip int brief": "Interface              IP-Address      OK? Method Status                Protocol\nGigabitEthernet1/0/1   unassigned      YES unset  up                    up\nGigabitEthernet1/0/24  10.10.10.2      YES NVRAM  up                    up\nVlan10                 10.20.10.1      YES NVRAM  up                    up\nVlan20                 10.20.20.1      YES NVRAM  up                    up",
      "show vlan brief": "VLAN Name                             Status    Ports\n---- -------------------------------- --------- -------------------------------\n1    default                          active    Gi1/0/1, Gi1/0/2\n10   USERS                            active    Gi1/0/10-Gi1/0/20\n20   SERVERS                          active    Gi1/0/21-Gi1/0/23\n99   MGMT                             active    Gi1/0/24",
      "show mac address-table": "Vlan    Mac Address       Type        Ports\n----    -----------       --------    -----\n10      08aa.bbcc.1101    DYNAMIC     Gi1/0/12\n20      08aa.bbcc.2202    DYNAMIC     Gi1/0/22\n99      0866.da11.2201    DYNAMIC     Gi1/0/24",
      "show cdp neighbors": "Device ID        Local Intrfce     Holdtme    Capability  Platform  Port ID\npa-3220-bom      Gig 1/0/24        148        R S I       PA-3220   ethernet1/1\nru-sz-01         Gig 1/0/10        132        R T         R720      eth0",
    },
  },
  "extreme-vsp": {
    title: "admin@fabric-core",
    prompt: "fabric-core:1#",
    banner: [
      "Extreme Networks Fabric Engine (VOSS)",
      "System type           : 7520-48YE-8C",
      "Software version      : 9.1.0.0",
      "------------------------------------------------",
      "Type 'help' for demo commands.",
    ],
    cmds: {
      help: "Commands: show isis adjacencies | show i-sid | show vlan | clear | exit",
      "show isis adjacencies": "================================================================================\nISIS Adjacencies\n================================================================================\nINTERFACE   L STATE        UPTIME   PRI  HOLDTIME  SYS ID\n1/1         1 UP           12d 4h   127  22        0011.2233.4401\n1/2         1 UP           12d 4h   127  21        0011.2233.4402",
      "show i-sid": "================================================================================\ni-sid     vlan   type     name\n10010     10     elan     USERS\n10020     20     elan     SERVERS\n10099     99     elan     MGMT",
      "show vlan": "================================================================================\nVLAN PORT\n================================================================================\nVLAN  NAME  TYPE  PORTS\n10    USERS  byPort  1/10-1/20\n20    SERVERS byPort 1/21-1/23",
    },
  },
};

let rackRef = null;
let cableGroup = null;
let devicePorts = {}; // id -> { left, right } world-local positions on rack
let chairRef = null;
let floorMesh = null;
const chairSpots = [
  { pos: new THREE.Vector3(0.25, 0, -0.2), yaw: 0.35 },
  { pos: new THREE.Vector3(1.35, 0, 0.55), yaw: -0.55 },
  { pos: new THREE.Vector3(-0.95, 0, 0.85), yaw: 0.9 },
  { pos: new THREE.Vector3(0.85, 0, 1.55), yaw: Math.PI + 0.2 },
  { pos: new THREE.Vector3(-0.35, 0, 1.75), yaw: Math.PI - 0.4 },
  { pos: new THREE.Vector3(1.6, 0, -0.55), yaw: -1.1 },
];
let chairSpotIndex = 0;

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: "high-performance",
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a221c);
scene.fog = new THREE.Fog(0x1a221c, 14, 30);

const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(4.6, 3.2, 5.8);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 3;
controls.maxDistance = 12;
controls.minPolarAngle = 0.3;
controls.maxPolarAngle = Math.PI * 0.49;
controls.target.set(0.15, 1.2, -0.5);
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

let mainScreenMat = null;
let workScreenTex = null;
let resumeScreenTex = null;
let resumeObject = null;

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
    map: opts.map,
    ...opts,
  });
}

function addShadow(mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function makeCanvasTexture(draw, w = 512, h = 512) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function makeLabelTexture(lines, opts = {}) {
  return makeCanvasTexture((g, w, h) => {
    g.fillStyle = opts.bg || "#0b1220";
    g.fillRect(0, 0, w, h);
    g.fillStyle = opts.fg || "#9ad0ff";
    g.font = opts.font || "bold 28px monospace";
    lines.forEach((line, i) => g.fillText(line, 24, 56 + i * 36));
  }, 512, 256);
}

function makeResumeMonitorTexture() {
  return makeCanvasTexture((g, w, h) => {
    g.fillStyle = "#0b1220";
    g.fillRect(0, 0, w, h);
    g.fillStyle = "#e8eef8";
    g.font = "bold 36px Georgia";
    g.fillText("TUFAIL AHMED SHEIKH", 36, 70);
    g.fillStyle = "#8eb6ff";
    g.font = "20px Helvetica";
    g.fillText("SASE · Network Delivery · Engineering Leader", 36, 108);
    g.strokeStyle = "#2a3a55";
    g.beginPath();
    g.moveTo(36, 128);
    g.lineTo(w - 36, 128);
    g.stroke();
    g.fillStyle = "#c9d4e8";
    g.font = "18px Helvetica";
    const lines = [
      "12+ years · Extreme Networks · Palo Alto · Cisco · Ruckus",
      "",
      "• Principal Architect — Network Platforms & Observability",
      "  Ford Blue Oval Michigan · Prisma Access · XSOAR · SCM",
      "",
      "• Head of Network Ops / SASE Product Head (India)",
      "  Extreme Networks · 2017–2024",
      "",
      "• Network Engineer — Ruckus · IT Analyst — Cisco",
      "",
      "Open the reader to scroll the full PDF,",
      "or use Download in the menu.",
    ];
    lines.forEach((line, i) => g.fillText(line, 36, 170 + i * 28));
    g.fillStyle = "#d9784a";
    g.font = "bold 18px Helvetica";
    g.fillText("RESUME ON SCREEN", 36, h - 40);
  }, 1024, 640);
}

function makeWorkMonitorTexture() {
  return makeLabelTexture(
    ["SASE DELIVERY", "Prisma · XSOAR", "telemetry pipeline", "roadmap · KPIs"],
    { bg: "#071018", fg: "#8ec7ff" }
  );
}

const CARPET_BASE = "/assets/models/carpet-ikea-persian/";

const CARPET_SIZE = { width: 7.2, depth: 5.1 }; // large, room-centered

function fitFlatFloorModel(object, { targetWidth, targetDepth, y = 0.012 } = {}) {
  const box = new THREE.Box3().setFromObject(object);
  const size = new THREE.Vector3();
  box.getSize(size);
  const center = new THREE.Vector3();
  box.getCenter(center);

  // Center on origin first
  object.position.sub(center);

  // Archicad / 3DS carpets are often authored lying on XY or ZX — force flat on floor
  if (size.y > size.x * 0.35 && size.y > size.z * 0.35) {
    object.rotation.x = -Math.PI / 2;
    object.updateMatrixWorld(true);
    box.setFromObject(object);
    box.getSize(size);
    box.getCenter(center);
    object.position.sub(center);
  }

  const sx = targetWidth / Math.max(size.x, 0.001);
  const sz = targetDepth / Math.max(size.z, 0.001);
  const s = Math.min(sx, sz);
  object.scale.setScalar(s);
  object.updateMatrixWorld(true);
  box.setFromObject(object);
  box.getCenter(center);
  object.position.x -= center.x;
  object.position.z -= center.z;
  object.position.y += y - box.min.y;

  object.traverse((child) => {
    if (!child.isMesh) return;
    child.castShadow = true;
    child.receiveShadow = true;
    const mats = Array.isArray(child.material) ? child.material : [child.material];
    mats.forEach((m) => {
      if (!m) return;
      m.side = THREE.DoubleSide;
      m.roughness = 0.92;
      m.metalness = 0;
      if (m.map) {
        m.map.colorSpace = THREE.SRGBColorSpace;
        m.map.anisotropy = 8;
        m.map.needsUpdate = true;
      }
      m.needsUpdate = true;
    });
  });
  return object;
}

function makeCarpetFallbackPlane() {
  const tex = new THREE.TextureLoader().load(`${CARPET_BASE}carpet.jpg`);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  const carpet = addShadow(
    new THREE.Mesh(
      new THREE.PlaneGeometry(CARPET_SIZE.width, CARPET_SIZE.depth),
      mat(0xffffff, { map: tex, roughness: 0.92, metalness: 0 })
    )
  );
  carpet.rotation.x = -Math.PI / 2;
  carpet.position.set(0, 0.015, 0);
  carpet.name = "ikea-persian-carpet-fallback";
  return carpet;
}

function loadIKEAPersianCarpet(parent) {
  return new Promise((resolve) => {
    const loader = new TDSLoader();
    loader.setResourcePath(CARPET_BASE);
    loader.load(
      `${CARPET_BASE}carpet.3ds`,
      (object) => {
        fitFlatFloorModel(object, {
          targetWidth: CARPET_SIZE.width,
          targetDepth: CARPET_SIZE.depth,
        });
        const wrap = new THREE.Group();
        wrap.name = "ikea-persian-carpet";
        wrap.add(object);
        // Exact room center — no offset / no skew
        wrap.position.set(0, 0, 0);
        wrap.rotation.y = 0;
        parent.add(wrap);
        resolve(wrap);
      },
      undefined,
      (err) => {
        console.warn("IKEA Persian carpet 3DS failed, using photo plane", err);
        parent.add(makeCarpetFallbackPlane());
        resolve(null);
      }
    );
  });
}

const CHAIR_BASE = "/assets/models/armchair-okamura-atlas/";

function fitChairModel(object, { targetHeight = 1.18 } = {}) {
  object.updateMatrixWorld(true);
  let box = new THREE.Box3().setFromObject(object);
  let size = new THREE.Vector3();
  box.getSize(size);
  let center = new THREE.Vector3();
  box.getCenter(center);
  object.position.sub(center);

  // Archibase Okamura Atlas is authored Z-up — map to Three.js Y-up
  if (size.z >= size.y * 0.9) {
    object.rotation.x = -Math.PI / 2;
  } else if (size.x >= size.y * 0.9 && size.x >= size.z * 0.9) {
    object.rotation.z = Math.PI / 2;
  }
  object.updateMatrixWorld(true);
  box = new THREE.Box3().setFromObject(object);
  box.getSize(size);
  box.getCenter(center);
  object.position.sub(center);

  const s = targetHeight / Math.max(size.y, 0.001);
  object.scale.setScalar(s);
  object.updateMatrixWorld(true);
  box = new THREE.Box3().setFromObject(object);
  box.getSize(size);
  box.getCenter(center);
  object.position.x -= center.x;
  object.position.z -= center.z;
  object.position.y += -box.min.y;

  // Face local -Z toward the desk: back = highest cluster of upper meshes
  const seat = new THREE.Vector3();
  const back = new THREE.Vector3();
  let seatN = 0;
  let backN = 0;
  const minY = box.min.y;
  const h = Math.max(size.y, 0.001);
  object.traverse((child) => {
    if (!child.isMesh) return;
    const b = new THREE.Box3().setFromObject(child);
    const c = new THREE.Vector3();
    b.getCenter(c);
    const relY = (c.y - minY) / h;
    const count = child.geometry?.attributes?.position?.count || 0;
    if (relY < 0.35 && count > 4000) {
      seat.add(c);
      seatN++;
    } else if (relY > 0.55) {
      back.add(c);
      backN++;
    }
  });
  if (seatN && backN) {
    seat.multiplyScalar(1 / seatN);
    back.multiplyScalar(1 / backN);
    const dir = new THREE.Vector3(back.x - seat.x, 0, back.z - seat.z);
    if (dir.lengthSq() > 1e-6) {
      dir.normalize();
      // Want back to sit at local +Z so seat faces local -Z (desk)
      const yaw = Math.atan2(dir.x, dir.z);
      object.rotation.y -= yaw;
      object.updateMatrixWorld(true);
      box = new THREE.Box3().setFromObject(object);
      box.getCenter(center);
      object.position.x -= center.x;
      object.position.z -= center.z;
      object.position.y = 0;
      box = new THREE.Box3().setFromObject(object);
      object.position.y = -box.min.y;
    }
  }
  return object;
}

function colorOkamuraChair(root) {
  // Mesh / seat / arms / base = black. Only the back outer profile/frame = red.
  const black = mat(0x0c0c0e, { roughness: 0.68, metalness: 0.06 });
  const red = mat(0xb91c1c, { roughness: 0.45, metalness: 0.14 });
  const metal = mat(0x17171a, { roughness: 0.32, metalness: 0.82 });

  root.updateMatrixWorld(true);
  const full = new THREE.Box3().setFromObject(root);
  const fullSize = new THREE.Vector3();
  full.getSize(fullSize);
  const minY = full.min.y;
  const midZ = (full.min.z + full.max.z) * 0.5;

  const infos = [];
  root.traverse((child) => {
    if (!child.isMesh) return;
    child.castShadow = true;
    child.receiveShadow = true;
    const b = new THREE.Box3().setFromObject(child);
    const c = new THREE.Vector3();
    const s = new THREE.Vector3();
    b.getCenter(c);
    b.getSize(s);
    const count = child.geometry?.attributes?.position?.count || 0;
    infos.push({
      child,
      count,
      relY: (c.y - minY) / Math.max(fullSize.y, 0.001),
      center: c,
      size: s,
      name: `${child.name || ""} ${child.material?.name || ""}`.toLowerCase(),
    });
  });

  // Densest parts are the fabric mesh — never red
  const byCount = [...infos].sort((a, b) => b.count - a.count);
  const meshFabric = new Set(byCount.slice(0, 4).map((i) => i.child));

  infos.forEach((info) => {
    const { child, count, relY, center, size, name } = info;
    const isChrome = /chrome|metal|steel/.test(name);
    const isFabric =
      meshFabric.has(child) || count >= 5000 || /linen|mesh|fabric/.test(name);

    // Back profile = low/mid-poly shell sitting on the rear half, above the seat
    const towardBack = center.z >= midZ - fullSize.z * 0.05;
    const thinShell = Math.min(size.x, size.z) < fullSize.x * 0.55;
    const isBackProfile =
      !isFabric &&
      relY > 0.42 &&
      count < 4500 &&
      towardBack &&
      (thinShell || relY > 0.58);

    let chosen = black;
    if (isBackProfile) chosen = red;
    else if (isChrome && relY < 0.4) chosen = metal;

    child.material = chosen.clone();
    child.material.side = THREE.DoubleSide;
    child.material.needsUpdate = true;
  });
}

function animateChairTo(pos, yaw, duration = 1.15) {
  if (!chairRef) return Promise.resolve();
  return new Promise((resolve) => {
    state.animating = true;
    const from = chairRef.position.clone();
    const fromYaw = chairRef.rotation.y;
    const start = performance.now();
    const spin = Math.atan2(pos.x - from.x, pos.z - from.z);
    const tick = (now) => {
      const t = Math.min(1, (now - start) / (duration * 1000));
      const e = easeInOut(t);
      chairRef.position.lerpVectors(from, pos, e);
      // Roll: ease toward travel heading mid-way, then settle to target yaw
      const travelBlend = Math.sin(Math.PI * e);
      const midYaw = THREE.MathUtils.lerp(fromYaw, spin, 0.65);
      chairRef.rotation.y = THREE.MathUtils.lerp(fromYaw, midYaw, travelBlend);
      chairRef.rotation.y = THREE.MathUtils.lerp(chairRef.rotation.y, yaw, e * e);
      // Subtle caster bounce
      chairRef.position.y = Math.abs(Math.sin(e * Math.PI)) * 0.02;
      if (t < 1) requestAnimationFrame(tick);
      else {
        chairRef.position.copy(pos);
        chairRef.position.y = 0;
        chairRef.rotation.y = yaw;
        state.animating = false;
        resolve();
      }
    };
    requestAnimationFrame(tick);
  });
}

async function rollChairNext() {
  if (!chairRef || state.animating) return;
  chairSpotIndex = (chairSpotIndex + 1) % chairSpots.length;
  const spot = chairSpots[chairSpotIndex];
  hintEl.textContent = "Chair rolling — click again to move, or click the floor to place";
  hintEl.classList.remove("hide");
  state.chairMoveMode = true;
  await animateChairTo(spot.pos.clone(), spot.yaw);
}

async function placeChairOnFloor(clientX, clientY) {
  if (!chairRef || !floorMesh || state.animating) return false;
  const rect = canvas.getBoundingClientRect();
  pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObject(floorMesh, false);
  if (!hits.length) return false;
  const p = hits[0].point.clone();
  p.y = 0;
  // Keep on the rug / room bounds
  p.x = THREE.MathUtils.clamp(p.x, -3.2, 3.2);
  p.z = THREE.MathUtils.clamp(p.z, -2.8, 3.2);
  const from = chairRef.position;
  const yaw = Math.atan2(p.x - from.x, p.z - from.z) + Math.PI;
  hintEl.textContent = "Chair placed — click it to roll again";
  hintEl.classList.remove("hide");
  await animateChairTo(p, yaw);
  return true;
}

function loadOkamuraAtlasChair(parent) {
  return new Promise((resolve) => {
    const loader = new TDSLoader();
    loader.setResourcePath(CHAIR_BASE);
    loader.load(
      `${CHAIR_BASE}chair.3ds`,
      (object) => {
        fitChairModel(object, { targetHeight: 1.22 });
        colorOkamuraChair(object);
        const wrap = new THREE.Group();
        wrap.name = "okamura-atlas-chair";
        wrap.userData = {
          id: "chair",
          focus: new THREE.Vector3(0.25, 0.85, -0.2),
        };
        wrap.add(object);
        const home = chairSpots[0];
        wrap.position.copy(home.pos);
        wrap.rotation.y = home.yaw;
        chairRef = wrap;
        parent.add(wrap);
        interactive.push(wrap);
        hotspotDefs.push({
          id: "chair",
          label: "Okamura Atlas",
          object: wrap,
          offset: new THREE.Vector3(0, 1.35, 0),
        });
        resolve(wrap);
      },
      undefined,
      (err) => {
        console.warn("Okamura Atlas chair failed to load", err);
        resolve(null);
      }
    );
  });
}

function woodMat(shade = 0x4a2c1d) {
  return mat(shade, { roughness: 0.48, metalness: 0.04 });
}

function addVictorianPanelling(room, { wall = "back" } = {}) {
  // Dark grey Victorian wainscot + raised panels
  const panelGrey = mat(0x3a3f45, { roughness: 0.62, metalness: 0.08 });
  const railGrey = mat(0x2c3036, { roughness: 0.55, metalness: 0.12 });
  const trim = mat(0x4a5058, { roughness: 0.45, metalness: 0.15 });

  if (wall === "back") {
    // Dado rail
    const dado = addShadow(new THREE.Mesh(new THREE.BoxGeometry(10.3, 0.08, 0.06), trim));
    dado.position.set(0, 1.15, -4.24);
    room.add(dado);
    // Chair rail / picture rail
    const picture = addShadow(new THREE.Mesh(new THREE.BoxGeometry(10.3, 0.06, 0.05), trim));
    picture.position.set(0, 3.15, -4.24);
    room.add(picture);
    // Skirting
    const skirt = addShadow(new THREE.Mesh(new THREE.BoxGeometry(10.3, 0.16, 0.07), railGrey));
    skirt.position.set(0, 0.08, -4.24);
    room.add(skirt);
    // Crown
    const crown = addShadow(new THREE.Mesh(new THREE.BoxGeometry(10.3, 0.12, 0.1), trim));
    crown.position.set(0, 4.28, -4.22);
    room.add(crown);

    // Raised panels in a grid
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 5; col++) {
        const panel = addShadow(new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.85, 0.04), panelGrey));
        panel.position.set(-3.4 + col * 1.85, 0.55 + row * 1.75, -4.25);
        room.add(panel);
        const inset = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.62, 0.02), railGrey);
        inset.position.set(-3.4 + col * 1.85, 0.55 + row * 1.75, -4.22);
        room.add(inset);
        // Bead molding hint
        const bead = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.68, 0.01), trim);
        bead.position.set(-3.4 + col * 1.85, 0.55 + row * 1.75, -4.21);
        room.add(bead);
      }
    }
  } else {
    const dado = addShadow(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 8.8), trim));
    dado.position.set(-4.29, 1.15, 0.1);
    room.add(dado);
    const picture = addShadow(new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.06, 8.8), trim));
    picture.position.set(-4.29, 3.15, 0.1);
    room.add(picture);
    const skirt = addShadow(new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.16, 8.8), railGrey));
    skirt.position.set(-4.29, 0.08, 0.1);
    room.add(skirt);
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 4; col++) {
        const panel = addShadow(new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.85, 1.7), panelGrey));
        panel.position.set(-4.3, 0.55 + row * 1.75, -2.7 + col * 1.9);
        room.add(panel);
        const inset = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.62, 1.45), railGrey);
        inset.position.set(-4.27, 0.55 + row * 1.75, -2.7 + col * 1.9);
        room.add(inset);
      }
    }
  }
}

function createRoom() {
  const room = new THREE.Group();

  const floor = addShadow(new THREE.Mesh(new THREE.PlaneGeometry(11, 11), mat(0x6a3b28, { roughness: 0.72 })));
  floor.rotation.x = -Math.PI / 2;
  floor.name = "floor";
  floorMesh = floor;
  room.add(floor);
  for (let i = -5; i <= 5; i++) {
    const seam = new THREE.Mesh(new THREE.PlaneGeometry(11, 0.018), mat(0x3f2217, { roughness: 1 }));
    seam.rotation.x = -Math.PI / 2;
    seam.position.set(0, 0.002, i * 0.95);
    room.add(seam);
  }

  // Dark grey wall base under panelling
  const wallMat = mat(0x343940, { roughness: 0.9 });
  const back = addShadow(new THREE.Mesh(new THREE.BoxGeometry(10.5, 4.4, 0.16), wallMat));
  back.position.set(0, 2.2, -4.35);
  room.add(back);
  const left = addShadow(new THREE.Mesh(new THREE.BoxGeometry(0.16, 4.4, 9), wallMat));
  left.position.set(-4.4, 2.2, 0.1);
  room.add(left);

  addVictorianPanelling(room, { wall: "back" });
  addVictorianPanelling(room, { wall: "left" });

  // Window + blinds (right)
  const win = addShadow(new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.4, 2.2), mat(0x111411)));
  win.position.set(4.2, 2.2, -1.2);
  room.add(win);
  for (let i = 0; i < 14; i++) {
    const blind = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.08, 2.05), mat(0x1a1f1c));
    blind.position.set(4.14, 1.2 + i * 0.15, -1.2);
    room.add(blind);
  }
  const softWin = new THREE.DirectionalLight(0xffe6c8, 0.55);
  softWin.position.set(5, 3.5, -1);
  room.add(softWin);

  // Carpet loaded async from IKEA Persian 3DS pack
  return room;
}

function addPerfumeBottle(parent, x, y, z, style = 0) {
  const g = new THREE.Group();
  const glassColors = [0xc9a36a, 0x1a3a4a, 0x4a2040, 0xd8c4a0, 0x2a4a3a, 0x6a2030];
  const color = glassColors[style % glassColors.length];
  const body = addShadow(
    new THREE.Mesh(
      style % 2 === 0
        ? new THREE.CylinderGeometry(0.028, 0.035, 0.14, 12)
        : new RoundedBoxGeometry(0.06, 0.14, 0.04, 1, 0.008),
      mat(color, { roughness: 0.15, metalness: 0.35, transparent: true, opacity: 0.92 })
    )
  );
  body.position.y = 0.07;
  g.add(body);
  const neck = addShadow(new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.014, 0.04, 10), mat(color, { metalness: 0.4, roughness: 0.2 })));
  neck.position.y = 0.16;
  g.add(neck);
  const cap = addShadow(new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.025, 10), mat(0xc9a227, { metalness: 0.85, roughness: 0.25 })));
  cap.position.y = 0.19;
  g.add(cap);
  // Label band
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.03, 12, 1, true), mat(0xf2e6d0, { roughness: 0.7 }));
  band.position.y = 0.06;
  g.add(band);
  g.position.set(x, y, z);
  parent.add(g);
  return g;
}

function addBooksOnShelf(parent, x0, y, z, count, spread = 0.13) {
  for (let i = 0; i < count; i++) {
    const h = 0.22 + Math.random() * 0.14;
    const w = 0.05 + Math.random() * 0.04;
    const book = addShadow(
      new THREE.Mesh(
        new THREE.BoxGeometry(w, h, 0.18 + Math.random() * 0.05),
        mat(new THREE.Color().setHSL(0.05 + Math.random() * 0.12, 0.35, 0.18 + Math.random() * 0.25), { roughness: 0.75 })
      )
    );
    book.position.set(x0 + i * spread, y + h / 2, z);
    parent.add(book);
    // gold foil hint
    if (Math.random() > 0.6) {
      const foil = new THREE.Mesh(
        new THREE.PlaneGeometry(0.01, h * 0.35),
        new THREE.MeshBasicMaterial({ color: 0xc9a227 })
      );
      foil.position.set(w / 2 + 0.001, 0, 0.02);
      book.add(foil);
    }
  }
}

function createBookshelfDesk() {
  const unit = new THREE.Group();
  unit.name = "bookshelfDesk";
  const wood = woodMat(0x4d2f20);
  const woodDark = woodMat(0x3a2418);

  // Desk surface
  const top = addShadow(new THREE.Mesh(new RoundedBoxGeometry(3.9, 0.09, 1.05, 2, 0.015), wood));
  top.position.set(0, 1.05, -1.55);
  unit.add(top);

  // Left drawers pedestal (3 drawers)
  const ped = addShadow(new THREE.Mesh(new RoundedBoxGeometry(0.95, 0.95, 0.85, 2, 0.02), woodDark));
  ped.position.set(-1.35, 0.52, -1.55);
  unit.add(ped);
  for (let i = 0; i < 3; i++) {
    const drawer = addShadow(new THREE.Mesh(new RoundedBoxGeometry(0.82, 0.22, 0.04, 1, 0.01), wood));
    drawer.position.set(-1.35, 0.28 + i * 0.28, -1.12);
    unit.add(drawer);
    const knob = addShadow(new THREE.Mesh(new THREE.SphereGeometry(0.025, 10, 10), mat(0xc9a227, { metalness: 0.7, roughness: 0.3 })));
    knob.position.set(-1.35, 0.28 + i * 0.28, -1.09);
    unit.add(knob);
  }

  // Right under-desk panel
  const rightPed = addShadow(new THREE.Mesh(new RoundedBoxGeometry(0.7, 0.95, 0.75, 2, 0.02), woodDark));
  rightPed.position.set(1.45, 0.52, -1.6);
  unit.add(rightPed);

  // Tall left bookcase
  const leftCase = addShadow(new THREE.Mesh(new RoundedBoxGeometry(0.85, 2.55, 0.42, 2, 0.02), wood));
  leftCase.position.set(-1.75, 2.0, -2.05);
  unit.add(leftCase);
  // Tall right bookcase
  const rightCase = addShadow(new THREE.Mesh(new RoundedBoxGeometry(0.85, 2.55, 0.42, 2, 0.02), wood));
  rightCase.position.set(1.75, 2.0, -2.05);
  unit.add(rightCase);
  // Bridge shelves across top
  const bridge = addShadow(new THREE.Mesh(new RoundedBoxGeometry(2.7, 0.9, 0.4, 2, 0.02), wood));
  bridge.position.set(0, 2.85, -2.05);
  unit.add(bridge);

  // Shelf boards
  const shelfYsLeft = [1.15, 1.55, 1.95, 2.35, 2.75, 3.1];
  shelfYsLeft.forEach((y) => {
    [-1.75, 1.75].forEach((x) => {
      const board = addShadow(new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.035, 0.36), woodDark));
      board.position.set(x, y, -2.05);
      unit.add(board);
    });
  });
  [2.55, 2.85, 3.15].forEach((y) => {
    const board = addShadow(new THREE.Mesh(new THREE.BoxGeometry(2.55, 0.035, 0.34), woodDark));
    board.position.set(0, y, -2.05);
    unit.add(board);
  });

  // Books — denser on both cases + bridge
  addBooksOnShelf(unit, -2.05, 1.15, -2.05, 5, 0.12);
  addBooksOnShelf(unit, -2.05, 1.55, -2.05, 5, 0.12);
  addBooksOnShelf(unit, -2.05, 1.95, -2.05, 4, 0.13);
  addBooksOnShelf(unit, -2.05, 2.35, -2.05, 5, 0.12);
  addBooksOnShelf(unit, 1.45, 1.15, -2.05, 5, 0.12);
  addBooksOnShelf(unit, 1.45, 1.55, -2.05, 5, 0.12);
  addBooksOnShelf(unit, 1.45, 1.95, -2.05, 5, 0.12);
  addBooksOnShelf(unit, 1.45, 2.35, -2.05, 4, 0.13);
  addBooksOnShelf(unit, -1.1, 2.55, -2.05, 14, 0.15);
  addBooksOnShelf(unit, -1.0, 2.85, -2.05, 10, 0.16);
  // Extra books on the front-facing right rack shelves
  addBooksOnShelf(unit, 1.42, 2.75, -2.05, 5, 0.12);
  addBooksOnShelf(unit, 1.42, 3.1, -2.05, 4, 0.13);

  // Perfume collection on the front/right rack (eye-level shelves)
  const perfumeYs = [1.58, 1.98, 2.38];
  perfumeYs.forEach((y, row) => {
    for (let i = 0; i < 4; i++) {
      addPerfumeBottle(unit, 1.48 + i * 0.1, y, -1.92, row * 4 + i);
    }
  });
  // Bridge shelf colognes
  for (let i = 0; i < 6; i++) {
    addPerfumeBottle(unit, -0.55 + i * 0.14, 2.58, -1.95, i + 2);
  }
  const netBox = addShadow(new THREE.Mesh(new RoundedBoxGeometry(0.35, 0.12, 0.22, 1, 0.01), mat(0xe8e8e8)));
  netBox.position.set(0.85, 2.72, -2.0);
  unit.add(netBox);

  // Printer left
  const printer = addShadow(new THREE.Mesh(new RoundedBoxGeometry(0.45, 0.28, 0.4, 2, 0.02), mat(0x2a2a2a, { roughness: 0.4 })));
  printer.position.set(-1.5, 1.24, -1.35);
  unit.add(printer);

  // Monitors
  workScreenTex = makeWorkMonitorTexture();
  resumeScreenTex = makeResumeMonitorTexture();
  mainScreenMat = new THREE.MeshStandardMaterial({
    map: workScreenTex,
    emissive: 0x1a3355,
    emissiveIntensity: 0.65,
    roughness: 0.25,
  });

  function makeMonitor(w, h, portrait = false) {
    const g = new THREE.Group();
    const bezel = addShadow(new THREE.Mesh(new RoundedBoxGeometry(w, h, 0.05, 2, 0.01), mat(0x101010, { roughness: 0.35 })));
    g.add(bezel);
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(w * 0.9, h * 0.86),
      portrait ? new THREE.MeshStandardMaterial({ map: makeLabelTexture(["code", "review", "diff"], { bg: "#0a1018", fg: "#9dffe0" }), emissive: 0x113322, emissiveIntensity: 0.5 }) : mainScreenMat
    );
    screen.position.z = 0.03;
    g.add(screen);
    if (!portrait) g.userData.screen = screen;
    const stand = addShadow(new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.26, 12), mat(0x222)));
    stand.position.y = -h / 2 - 0.13;
    g.add(stand);
    const base = addShadow(new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.17, 0.03, 16), mat(0x222)));
    base.position.y = -h / 2 - 0.26;
    g.add(base);
    return g;
  }

  const mainMon = makeMonitor(1.15, 0.68);
  mainMon.position.set(0.05, 1.58, -1.32);
  unit.add(mainMon);
  mainMon.userData = { id: "monitors", focus: new THREE.Vector3(0.05, 1.55, -1.2), screen: mainMon.children.find((c) => c.material === mainScreenMat) || mainMon.userData.screen };
  // fix screen reference
  mainMon.traverse((ch) => {
    if (ch.material === mainScreenMat) mainMon.userData.screenMesh = ch;
  });
  interactive.push(mainMon);

  const sideMon = makeMonitor(0.48, 0.78, true);
  sideMon.position.set(-0.95, 1.6, -1.28);
  sideMon.rotation.y = 0.22;
  unit.add(sideMon);

  // Laptop
  const laptop = addShadow(new THREE.Mesh(new RoundedBoxGeometry(0.52, 0.02, 0.36, 2, 0.008), mat(0x2c2c2c, { metalness: 0.45, roughness: 0.3 })));
  laptop.position.set(0.2, 1.12, -1.2);
  unit.add(laptop);

  // Lamp with cream pleated shade
  const lamp = new THREE.Group();
  const baseL = addShadow(new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.05, 16), mat(0x2f5d45)));
  lamp.add(baseL);
  const pole = addShadow(new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.45, 10), mat(0xd9cbb0)));
  pole.position.y = 0.25;
  lamp.add(pole);
  const shade = addShadow(new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.16, 20, 1, true), mat(0xf0e6d4, { roughness: 0.9 })));
  shade.position.y = 0.5;
  lamp.add(shade);
  const bulb = new THREE.PointLight(0xffd4a8, 16, 4.5, 2);
  bulb.position.y = 0.45;
  bulb.castShadow = true;
  lamp.add(bulb);
  lamp.position.set(1.25, 1.12, -1.35);
  unit.add(lamp);

  // White router on right
  const router = addShadow(new THREE.Mesh(new RoundedBoxGeometry(0.28, 0.06, 0.18, 1, 0.01), mat(0xf2f2f2)));
  router.position.set(1.55, 1.12, -1.25);
  unit.add(router);

  // Resume on desk
  resumeObject = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const page = addShadow(
      new THREE.Mesh(new RoundedBoxGeometry(0.4, 0.008, 0.56, 1, 0.003), mat(i === 2 ? 0xf8f3ea : 0xeae2d4, { roughness: 0.88 }))
    );
    page.position.y = i * 0.01;
    page.rotation.y = (i - 1) * 0.035;
    resumeObject.add(page);
  }
  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(0.32, 0.08),
    new THREE.MeshBasicMaterial({
      map: makeLabelTexture(["RESUME", "Tufail A. Sheikh"], { bg: "#f8f3ea", fg: "#2a2018", font: "bold 36px Georgia" }),
    })
  );
  label.rotation.x = -Math.PI / 2;
  label.position.set(0, 0.035, -0.1);
  resumeObject.add(label);
  const glow = new THREE.PointLight(0xffc38a, 2.2, 1.6, 2);
  glow.position.set(0, 0.18, 0);
  resumeObject.add(glow);
  resumeObject.position.set(0.85, 1.115, -1.18);
  resumeObject.userData = { id: "resume", focus: new THREE.Vector3(0.4, 1.45, -1.05) };
  unit.add(resumeObject);
  interactive.push(resumeObject);

  hotspotDefs.push({ id: "resume", label: "Resume", object: resumeObject, offset: new THREE.Vector3(0, 0.32, 0) });
  hotspotDefs.push({ id: "monitors", label: "Monitor", object: mainMon, offset: new THREE.Vector3(0, 0.5, 0) });

  return unit;
}


function makeCable(a, b, color = 0x2f9e44) {
  const mid = a.clone().lerp(b, 0.5);
  mid.z += 0.35 + Math.random() * 0.15;
  mid.x += (Math.random() - 0.5) * 0.08;
  const curve = new THREE.CatmullRomCurve3([a, mid, b]);
  const geo = new THREE.TubeGeometry(curve, 24, 0.008, 6, false);
  const mesh = new THREE.Mesh(geo, mat(color, { roughness: 0.55, metalness: 0.05 }));
  mesh.castShadow = true;
  return mesh;
}

function buildDeviceChassis({ y, height, color, accent, title, subtitle, deviceId, portCount = 12 }) {
  const u = new THREE.Group();
  u.userData = {
    id: "device",
    deviceId,
    focus: new THREE.Vector3(-2.55, y, -0.55),
  };

  // Shorter depth so the faceplate sits proud of the open rack
  const body = addShadow(
    new THREE.Mesh(
      new RoundedBoxGeometry(0.64, height, 0.55, 1, 0.01),
      mat(color, { metalness: 0.28, roughness: 0.35 })
    )
  );
  u.add(body);

  // Front faceplate label
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(0.58, height * 0.4),
    new THREE.MeshStandardMaterial({
      map: makeLabelTexture([title, subtitle], {
        bg: "#0f1318",
        fg: "#f5f7fa",
        font: "bold 30px Helvetica",
      }),
      roughness: 0.3,
      metalness: 0.1,
    })
  );
  face.position.set(0, height * 0.2, 0.285);
  u.add(face);

  // Bright status LED strip
  const led = new THREE.Mesh(
    new THREE.BoxGeometry(0.54, 0.022, 0.014),
    mat(accent, { emissive: accent, emissiveIntensity: 1.6 })
  );
  led.position.set(0, height * 0.4, 0.285);
  u.add(led);
  const ledGlow = new THREE.PointLight(accent, 1.4, 0.9, 2);
  ledGlow.position.set(0, height * 0.4, 0.4);
  u.add(ledGlow);

  // LCD / console window
  const lcd = new THREE.Mesh(
    new THREE.PlaneGeometry(0.22, 0.055),
    mat(0x04140c, { emissive: 0x1aff8c, emissiveIntensity: 0.55 })
  );
  lcd.position.set(0.17, height * 0.2, 0.288);
  u.add(lcd);

  // Visible RJ45 / SFP ports protruding from the face
  const ports = [];
  const rowY = -height * 0.2;
  for (let i = 0; i < portCount; i++) {
    const px = -0.27 + (i % 8) * 0.068;
    const py = rowY - Math.floor(i / 8) * 0.055;
    const port = addShadow(
      new THREE.Mesh(
        new THREE.BoxGeometry(0.045, 0.032, 0.05),
        mat(0x111111, { metalness: 0.45, roughness: 0.35 })
      )
    );
    port.position.set(px, py, 0.3);
    // Metal contact hint inside port
    const contact = new THREE.Mesh(
      new THREE.BoxGeometry(0.03, 0.012, 0.01),
      mat(0xc9a227, { metalness: 0.8, roughness: 0.3 })
    );
    contact.position.set(px, py - 0.005, 0.325);
    // Link/activity LEDs (green + amber)
    const linkOn = i % 5 !== 0;
    const pLed = new THREE.Mesh(
      new THREE.BoxGeometry(0.014, 0.01, 0.008),
      mat(linkOn ? 0x22ff66 : 0x333333, {
        emissive: linkOn ? 0x22ff66 : 0x000000,
        emissiveIntensity: linkOn ? 1.4 : 0,
      })
    );
    pLed.position.set(px - 0.01, py + 0.022, 0.328);
    pLed.userData.portLed = linkOn ? "link" : "off";
    const actLed = new THREE.Mesh(
      new THREE.BoxGeometry(0.014, 0.01, 0.008),
      mat(linkOn ? 0xffaa00 : 0x222222, {
        emissive: linkOn ? 0xffaa00 : 0x000000,
        emissiveIntensity: linkOn ? 0.9 : 0,
      })
    );
    actLed.position.set(px + 0.01, py + 0.022, 0.328);
    actLed.userData.portLed = linkOn ? "act" : "off";
    actLed.userData.phase = i * 0.37;
    u.add(port, contact, pLed, actLed);
    ports.push(new THREE.Vector3(px, py, 0.34));
  }

  // Console / USB / HA ports
  const consolePort = addShadow(new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.032, 0.04), mat(0x1a1a1a)));
  consolePort.position.set(-0.25, height * 0.2, 0.3);
  u.add(consolePort);
  const usb = addShadow(new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.02, 0.03), mat(0x333)));
  usb.position.set(-0.18, height * 0.2, 0.3);
  u.add(usb);

  u.position.y = y;
  u.userData.ports = ports;
  u.userData.deviceId = deviceId;
  return u;
}

function createRack() {
  const rack = new THREE.Group();
  rackRef = rack;

  // Open 4-post rack — no lid / no closed cabinet shell
  const postMat = mat(0x6a7180, { metalness: 0.85, roughness: 0.28 });
  const postPositions = [
    [-0.32, 0.32],
    [-0.32, -0.28],
    [0.32, 0.32],
    [0.32, -0.28],
  ];
  postPositions.forEach(([x, z]) => {
    const post = addShadow(new THREE.Mesh(new THREE.BoxGeometry(0.045, 2.2, 0.045), postMat));
    post.position.set(x, 1.15, z);
    rack.add(post);
    // Rack unit holes hint
    for (let i = 0; i < 18; i++) {
      const hole = new THREE.Mesh(
        new THREE.BoxGeometry(0.01, 0.012, 0.02),
        mat(0x111)
      );
      hole.position.set(x + (x > 0 ? -0.02 : 0.02), 0.35 + i * 0.1, z + (z > 0 ? 0.02 : -0.02));
      rack.add(hole);
    }
  });

  // Top & bottom frames only (no lid panel)
  const topFrame = addShadow(new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.05, 0.65), postMat));
  topFrame.position.set(0, 2.28, 0.02);
  rack.add(topFrame);
  const botFrame = addShadow(new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.06, 0.65), postMat));
  botFrame.position.set(0, 0.08, 0.02);
  rack.add(botFrame);

  // Side mounting rails (front)
  [-0.3, 0.3].forEach((x) => {
    const rail = addShadow(new THREE.Mesh(new THREE.BoxGeometry(0.03, 2.05, 0.03), mat(0x9aa3b0, { metalness: 0.9, roughness: 0.25 })));
    rail.position.set(x, 1.15, 0.34);
    rack.add(rail);
  });

  const pa = buildDeviceChassis({
    y: 1.95,
    height: 0.28,
    color: 0xf0f0f0,
    accent: 0xff5a1f,
    title: "PALO ALTO PA-3220",
    subtitle: "NGFW · 10G · HA ready",
    deviceId: "pa-3220",
    portCount: 12,
  });
  const cisco = buildDeviceChassis({
    y: 1.55,
    height: 0.22,
    color: 0x0d3a66,
    accent: 0x1ba0d7,
    title: "CISCO CATALYST 9300",
    subtitle: "48U · StackWise",
    deviceId: "cisco-9300",
    portCount: 16,
  });
  const extreme = buildDeviceChassis({
    y: 1.22,
    height: 0.22,
    color: 0x2a1438,
    accent: 0x9b4dca,
    title: "EXTREME 7520",
    subtitle: "Fabric Engine · SPB",
    deviceId: "extreme-vsp",
    portCount: 12,
  });
  const patch = buildDeviceChassis({
    y: 0.88,
    height: 0.18,
    color: 0x222222,
    accent: 0x88ff88,
    title: "PATCH PANEL 24P",
    subtitle: "Cat6A · Keystone",
    deviceId: "patch-panel",
    portCount: 16,
  });
  // Patch panel is not a console device — keep it visible but non-interactive for CLI
  patch.userData.id = "rack";

  [pa, cisco, extreme, patch].forEach((d) => {
    rack.add(d);
    if (d.userData.deviceId !== "patch-panel") interactive.push(d);
    devicePorts[d.userData.deviceId] = devicePorts[d.userData.deviceId] || [];
    devicePorts[d.userData.deviceId].push(
      ...d.userData.ports.map((p) => p.clone().add(new THREE.Vector3(0, d.position.y, 0)))
    );
  });

  // PDU
  const pdu = addShadow(new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.8, 0.08), mat(0x222, { metalness: 0.5 })));
  pdu.position.set(0.34, 1.1, -0.2);
  rack.add(pdu);

  cableGroup = new THREE.Group();
  cableGroup.visible = true; // cables visible on open rack by default
  state.cablesOn = true;
  rack.add(cableGroup);

  // Prebuild demo patch cables between PA <-> Cisco <-> Extreme <-> Patch
  const links = [
    ["pa-3220", "cisco-9300", 0xff5a1f],
    ["cisco-9300", "extreme-vsp", 0x1ba0d7],
    ["extreme-vsp", "patch-panel", 0x9b4dca],
    ["cisco-9300", "patch-panel", 0xffaa44],
    ["pa-3220", "extreme-vsp", 0x44ccff],
  ];
  links.forEach(([aId, bId, color], idx) => {
    const aPorts = devicePorts[aId];
    const bPorts = devicePorts[bId];
    if (!aPorts?.length || !bPorts?.length) return;
    const a = aPorts[Math.min(idx, aPorts.length - 1)].clone();
    const b = bPorts[Math.min(idx + 2, bPorts.length - 1)].clone();
    cableGroup.add(makeCable(a, b, color));
  });

  // Front fill lights so port LEDs read clearly
  const rl = new THREE.PointLight(0xffe0c0, 8, 5, 2);
  rl.position.set(0.15, 1.6, 1.1);
  rack.add(rl);
  const rl2 = new THREE.PointLight(0xff7a3d, 3.5, 3.5, 2);
  rl2.position.set(-0.2, 2.0, 0.8);
  rack.add(rl2);

  // Small label on top frame (not a lid)
  const plaque = new THREE.Mesh(
    new THREE.PlaneGeometry(0.55, 0.07),
    new THREE.MeshBasicMaterial({
      map: makeLabelTexture(["OPEN RACK · DEMO LAB"], { bg: "#111", fg: "#ffb089", font: "bold 28px Helvetica" }),
    })
  );
  plaque.position.set(0, 2.34, 0.36);
  rack.add(plaque);

  rack.position.set(-2.55, 0, -1.35);
  rack.userData = { id: "rack", focus: new THREE.Vector3(-2.55, 1.4, -0.55) };
  interactive.push(rack);
  hotspotDefs.push({ id: "rack", label: "Network rack", object: rack, offset: new THREE.Vector3(0, 2.45, 0.35) });
  return rack;
}

function toggleCables(force) {
  if (!cableGroup) return;
  state.cablesOn = typeof force === "boolean" ? force : !state.cablesOn;
  cableGroup.visible = state.cablesOn;
  if (state.cablesOn) {
    hintEl.textContent = "Cables connected · click a firewall/switch for console";
    hintEl.classList.remove("hide");
  }
}

function openConsole(deviceId = state.activeDevice) {
  const id = DEVICES[deviceId] ? deviceId : "pa-3220";
  const conf = DEVICES[id];
  state.activeDevice = id;
  const panel = document.getElementById("console-panel");
  document.getElementById("console-title").textContent = conf.title;
  document.getElementById("console-prompt").textContent = conf.prompt;
  document.getElementById("console-out").textContent = conf.banner.join("\n") + "\n";
  panel.hidden = false;
  document.getElementById("console-input").focus();
}

function appendConsole(text) {
  const out = document.getElementById("console-out");
  out.textContent += text + (text.endsWith("\n") ? "" : "\n");
  out.scrollTop = out.scrollHeight;
}

function runConsoleCommand(raw) {
  const conf = DEVICES[state.activeDevice] || DEVICES["pa-3220"];
  const cmd = raw.trim().toLowerCase();
  appendConsole(`${conf.prompt} ${raw}`);
  if (!cmd) return;
  if (cmd === "clear") {
    document.getElementById("console-out").textContent = "";
    return;
  }
  if (cmd === "exit") {
    document.getElementById("console-panel").hidden = true;
    return;
  }
  if (cmd === "run demo" || cmd === "demo") {
    runDeviceDemo();
    return;
  }
  const key = Object.keys(conf.cmds).find((k) => k === cmd);
  appendConsole(key ? conf.cmds[key] : `% Unknown command: ${raw}\nType 'help'`);
}

async function runDeviceDemo() {
  const conf = DEVICES[state.activeDevice] || DEVICES["pa-3220"];
  const steps =
    state.activeDevice === "cisco-9300"
      ? ["show ip int brief", "show vlan brief", "show cdp neighbors"]
      : state.activeDevice === "extreme-vsp"
        ? ["show isis adjacencies", "show i-sid"]
        : ["show system info", "show interface all", "show session info", "ping"];
  for (const step of steps) {
    appendConsole(`${conf.prompt} ${step}`);
    await new Promise((r) => setTimeout(r, 350));
    appendConsole(conf.cmds[step] || "");
    await new Promise((r) => setTimeout(r, 450));
  }
  appendConsole("\n[demo complete] Interfaces up · tunnels healthy · routes active.");
}

function createGithubFrame() {
  const frame = new THREE.Group();
  frame.add(addShadow(new THREE.Mesh(new RoundedBoxGeometry(0.7, 0.7, 0.06, 2, 0.02), mat(0x111))));
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(0.55, 0.55),
    new THREE.MeshBasicMaterial({
      map: makeLabelTexture(["GitHub", "TufaylAhmed"], { bg: "#0d1117", fg: "#f0f6fc", font: "bold 48px Helvetica" }),
    })
  );
  face.position.z = 0.04;
  frame.add(face);
  frame.position.set(-4.28, 1.45, 0.6);
  frame.rotation.y = Math.PI / 2;
  frame.userData = { id: "github", focus: new THREE.Vector3(-3.3, 1.45, 0.6) };
  interactive.push(frame);
  hotspotDefs.push({ id: "github", label: "GitHub", object: frame, offset: new THREE.Vector3(0.15, 0.4, 0) });
  return frame;
}

function createAboutPlant() {
  const g = new THREE.Group();
  g.add(addShadow(new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.14, 0.25, 16), mat(0x3d2a20))));
  for (let i = 0; i < 8; i++) {
    const leaf = addShadow(new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), mat(0x2f6b3a, { roughness: 0.8 })));
    leaf.scale.set(1, 0.55, 1.3);
    leaf.position.set(Math.cos((i / 8) * Math.PI * 2) * 0.12, 0.4 + (i % 3) * 0.08, Math.sin((i / 8) * Math.PI * 2) * 0.12);
    g.add(leaf);
  }
  g.position.set(2.7, 0, 1.7);
  g.userData = { id: "about", focus: new THREE.Vector3(2.2, 1.2, 1.4) };
  interactive.push(g);
  hotspotDefs.push({ id: "about", label: "About me", object: g, offset: new THREE.Vector3(0, 0.95, 0) });
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
    def.el.style.display = world.z < 1 ? "block" : "none";
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

function showResumeOnMonitor(on) {
  if (!mainScreenMat) return;
  mainScreenMat.map = on ? resumeScreenTex : workScreenTex;
  mainScreenMat.emissive = new THREE.Color(on ? 0x2a2010 : 0x1a3355);
  mainScreenMat.emissiveIntensity = on ? 0.45 : 0.65;
  mainScreenMat.needsUpdate = true;
  if (mainScreenMat.map) mainScreenMat.map.needsUpdate = true;
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

async function focusObject(id, deviceId) {
  if (id !== "chair" && id !== "chair-roll") {
    state.chairMoveMode = false;
  }
  hintEl.classList.add("hide");
  if (id === "resume") {
    await openResume();
    return;
  }
  if (id === "download") {
    downloadModal.hidden = false;
    return;
  }
  if (id === "chair" || id === "chair-roll") {
    if (chairRef) {
      const focus = chairRef.position.clone().add(new THREE.Vector3(0, 0.9, 0));
      const camPos = focus.clone().add(new THREE.Vector3(1.6, 0.85, 1.7));
      await animateCamera(camPos, focus, 0.85);
    }
    state.chairMoveMode = true;
    await rollChairNext();
    openPanel("chair");
    state.focus = "chair";
    return;
  }
  if (id === "cables") {
    const rack = interactive.find((o) => o.userData.id === "rack");
    if (rack) {
      const focus = rack.userData.focus.clone();
      const camPos = focus.clone().add(new THREE.Vector3(1.7, 0.45, 1.35));
      await animateCamera(camPos, focus, 0.95);
    }
    toggleCables();
    openPanel("rack");
    return;
  }
  if (id === "console") {
    const rack = interactive.find((o) => o.userData.id === "rack");
    if (rack) {
      const focus = rack.userData.focus.clone();
      const camPos = focus.clone().add(new THREE.Vector3(1.55, 0.5, 1.25));
      await animateCamera(camPos, focus, 0.95);
    }
    toggleCables(true);
    openConsole(state.activeDevice || "pa-3220");
    return;
  }
  if (id === "device") {
    const rack = interactive.find((o) => o.userData.id === "rack");
    const focus = (rack?.userData.focus || new THREE.Vector3(-2.55, 1.35, -0.95)).clone();
    if (deviceId === "pa-3220") focus.y = 1.95;
    if (deviceId === "cisco-9300") focus.y = 1.55;
    if (deviceId === "extreme-vsp") focus.y = 1.22;
    const camPos = focus.clone().add(new THREE.Vector3(1.35, 0.25, 1.15));
    await animateCamera(camPos, focus, 0.9);
    toggleCables(true);
    openConsole(deviceId || "pa-3220");
    return;
  }

  const obj = interactive.find((o) => o.userData.id === id);
  if (!obj) return;
  const focus = obj.userData.focus || obj.position.clone();
  const dir = new THREE.Vector3(1.35, 1.0, 1.7);
  if (id === "rack") dir.set(1.55, 0.55, 1.25);
  if (id === "github") dir.set(1.15, 0.25, 0.15);
  if (id === "about") dir.set(-1.15, 0.75, 0.95);
  if (id === "monitors") dir.set(0.3, 0.55, 1.6);
  const camPos = focus.clone().add(dir.normalize().multiplyScalar(id === "rack" ? 2.35 : 2.7));
  await animateCamera(camPos, focus, 1.0);
  if (id === "rack") toggleCables(true);
  openPanel(id);
  state.focus = id;
}

async function openResume() {
  closePanel();
  const focus = new THREE.Vector3(0.25, 1.45, -1.15);
  const camPos = new THREE.Vector3(0.55, 1.85, 0.85);
  await animateCamera(camPos, focus, 1.05);
  showResumeOnMonitor(true);
  if (resumeObject) resumeObject.position.y = 1.2;
  state.resumeOpen = true;
  resumeFrame.src = `${RESUME_PDF}#view=FitH`;
  resumeSheet.hidden = false;
}

function closeResume() {
  resumeSheet.hidden = true;
  resumeFrame.src = "about:blank";
  showResumeOnMonitor(false);
  if (resumeObject) resumeObject.position.y = 1.115;
  state.resumeOpen = false;
}

function onPointer(event) {
  if (state.animating || state.resumeOpen) return;
  const rect = canvas.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(interactive, true);
  if (hits.length) {
    let obj = hits[0].object;
    while (obj && !obj.userData?.id) obj = obj.parent;
    if (obj?.userData?.id) {
      if (obj.userData.id === "device") focusObject("device", obj.userData.deviceId);
      else focusObject(obj.userData.id);
      return;
    }
  }
  // Floor placement while chair move mode is active
  if (state.chairMoveMode) {
    placeChairOnFloor(event.clientX, event.clientY);
  }
}

function onMove(event) {
  const rect = canvas.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const overInteractive = raycaster.intersectObjects(interactive, true).length > 0;
  if (overInteractive) {
    canvas.style.cursor = "pointer";
    return;
  }
  if (state.chairMoveMode && floorMesh) {
    const floorHits = raycaster.intersectObject(floorMesh, false);
    canvas.style.cursor = floorHits.length ? "cell" : "grab";
    return;
  }
  canvas.style.cursor = "grab";
}

scene.add(new THREE.HemisphereLight(0xdde6ff, 0x2a1a12, 0.5));
const sun = new THREE.DirectionalLight(0xffe2c4, 1.3);
sun.position.set(4.5, 7, 3);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 22;
sun.shadow.camera.left = -7;
sun.shadow.camera.right = 7;
sun.shadow.camera.top = 7;
sun.shadow.camera.bottom = -7;
scene.add(sun);
scene.add(new THREE.DirectionalLight(0x8eb6ff, 0.22).translateX(-4).translateY(3));

// UI
document.getElementById("panel-close").addEventListener("click", closePanel);
document.getElementById("btn-reset").addEventListener("click", resetView);
document.getElementById("resume-close").addEventListener("click", async () => {
  closeResume();
  await animateCamera(defaultCam.position, defaultCam.target, 0.9);
});
document.getElementById("btn-download").addEventListener("click", () => {
  downloadModal.hidden = false;
});
document.querySelectorAll("[data-close-dl]").forEach((el) =>
  el.addEventListener("click", () => {
    downloadModal.hidden = true;
  })
);
document.querySelectorAll("[data-menu]").forEach((btn) => {
  btn.addEventListener("click", () => focusObject(btn.getAttribute("data-menu")));
});

document.getElementById("console-close").addEventListener("click", () => {
  document.getElementById("console-panel").hidden = true;
});
document.getElementById("console-run").addEventListener("click", () => {
  runDeviceDemo();
});
document.getElementById("console-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const input = document.getElementById("console-input");
  runConsoleCommand(input.value);
  input.value = "";
});

async function resetView() {
  closePanel();
  closeResume();
  document.getElementById("console-panel").hidden = true;
  toggleCables(false);
  await animateCamera(defaultCam.position, defaultCam.target, 1);
  state.focus = null;
}

const dlForm = document.getElementById("dl-form");
const dlStatus = document.getElementById("dl-status");
const dlSubmit = document.getElementById("dl-submit");
dlForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  dlStatus.textContent = "";
  dlStatus.className = "form-status";
  dlSubmit.disabled = true;
  dlSubmit.textContent = "Preparing…";
  try {
    const res = await fetch("/api/request-resume.php", {
      method: "POST",
      headers: { Accept: "application/json" },
      body: new FormData(dlForm),
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

const mobileNote = document.getElementById("mobile-note");
if (window.matchMedia("(max-width: 720px)").matches) mobileNote.hidden = false;
document.getElementById("mobile-continue").addEventListener("click", () => {
  mobileNote.hidden = true;
});
document.getElementById("mobile-resume").addEventListener("click", () => {
  mobileNote.hidden = true;
  focusObject("resume");
});
document.getElementById("mobile-download").addEventListener("click", () => {
  mobileNote.hidden = true;
  downloadModal.hidden = false;
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
  const room = createRoom();
  scene.add(room);
  setProgress(0.35);
  await loadIKEAPersianCarpet(room);
  setProgress(0.45);
  const desk = createBookshelfDesk();
  scene.add(desk);
  await loadOkamuraAtlasChair(scene);
  setProgress(0.6);
  scene.add(createRack());
  scene.add(createGithubFrame());
  scene.add(createAboutPlant());
  createHotspotButtons();
  setProgress(1);
  setTimeout(() => loaderEl.classList.add("done"), 250);

  function animate() {
    const t = clock.getElapsedTime();
    if (resumeObject && !state.resumeOpen) {
      const light = resumeObject.children.find((c) => c.isLight);
      if (light) light.intensity = 1.7 + Math.sin(t * 2.2) * 0.7;
      resumeObject.rotation.y = Math.sin(t * 0.7) * 0.03;
    }
    const rack = interactive.find((o) => o.userData.id === "rack");
    if (rack) {
      rack.traverse((c) => {
        if (!c.userData?.portLed || c.userData.portLed === "off") return;
        if (c.userData.portLed === "act") {
          const pulse = 0.35 + Math.abs(Math.sin(t * 9 + (c.userData.phase || 0)));
          c.material.emissiveIntensity = pulse * 1.6;
        } else if (c.userData.portLed === "link") {
          c.material.emissiveIntensity = 1.2 + Math.sin(t * 2.4) * 0.25;
        }
      });
    }
    controls.update();
    updateHotspots();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();
}

init();
