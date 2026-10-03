import * as THREE from 'three';
import { CAMERA_OFFSET, CAMERA_YAW, ROOM, PLAYER, PALETTE } from './constants.js';
import { screenToWorld, facingFromDirection, dampAngle } from './movement.js';
import { AGENTS, BOSS } from '../data/agents.js';

/**
 * Modern Architectural Low-Poly 3D Virtual AI Office
 * Features:
 * - Isometric Orthographic Camera with smooth target panning & zoom
 * - Screen-relative anti-inverted WASD movement + Click-to-move raycasting
 * - 6 AI Agent Workstations with low-poly avatars, idle typing animation, and floating canvas status badges
 * - Boss character (Raffa) with walking animation, crown/accent, facing direction
 * - War-room holographic table with rotating rings and glowing core
 * - Indoor plants (monstera, snake plant) and architectural studio lights
 * - Focus camera on any agent desk during mission steps
 */
export class OfficeScene {
  constructor(container, onInteractPrompt, onDeskClicked) {
    this.container = container;
    this.onInteractPrompt = onInteractPrompt || (() => {});
    this.onDeskClicked = onDeskClicked || (() => {});

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.clock = new THREE.Clock();

    // Camera control
    this.camTarget = new THREE.Vector3(0, 0, 0);
    this.camCurrentLook = new THREE.Vector3(0, 0, 0);
    this.zoomLevel = 1.0;
    this.targetZoom = 1.0;
    this.focusingOnAgent = null;

    // Boss Player
    this.player = null;
    this.playerPos = new THREE.Vector3(BOSS.spawn.x, 0, BOSS.spawn.z);
    this.playerTargetPos = null; // for click-to-move
    this.playerFacing = 0;
    this.targetFacing = 0;
    this.isMoving = false;
    this.walkCycle = 0;
    this.playerParts = {};

    // Destination ring indicator
    this.destRing = null;

    // AI Agents
    this.agentMeshes = new Map(); // id -> { group, avatar, arms, badgeSprite, canvas, ctx, texture, deskPos }

    // Hologram table
    this.holoElements = [];

    // Interaction raycasting
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.interactiveMeshes = []; // for desk clicks
    this.floorPlane = null;

    // Animation frame
    this.animId = null;
    this.disposed = false;

    this.init();
  }

  init() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    const aspect = width / height;

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#0c0c0e');
    this.scene.fog = new THREE.FogExp2('#0c0c0e', 0.015);

    // 2. Isometric Orthographic Camera (d = 10 fills the screen beautifully)
    const d = 10;
    this.camera = new THREE.OrthographicCamera(
      -d * aspect,
      d * aspect,
      d,
      -d,
      0.1,
      300
    );
    this.camera.position.set(CAMERA_OFFSET.x, CAMERA_OFFSET.y, CAMERA_OFFSET.z);
    this.camera.lookAt(0, 0, 0);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.container.appendChild(this.renderer.domElement);

    // 4. Lighting - Architectural Warm Studio
    this.setupLighting();

    // 5. Environment & Floor
    this.setupArchitecture();

    // 6. Workstations & AI Agents
    this.setupWorkstations();

    // 7. War-Room Holographic Table
    this.setupHolotable();

    // 8. Player: Raffa (The Boss)
    this.setupPlayer();

    // 9. Destination Click Ring
    this.setupDestRing();

    // 10. Plants & Props
    this.setupProps();

    // 11. Event Listeners
    this.setupEvents();

    // 12. Start Loop
    this.animate = this.animate.bind(this);
    this.animId = requestAnimationFrame(this.animate);
  }

  setupLighting() {
    // Soft ambient
    const ambient = new THREE.AmbientLight('#cdc7c0', 0.85);
    this.scene.add(ambient);

    // Main Studio Key Light (directional)
    const keyLight = new THREE.DirectionalLight('#fff5eb', 1.8);
    keyLight.position.set(16, 26, 12);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 70;
    const shadowD = 22;
    keyLight.shadow.camera.left = -shadowD;
    keyLight.shadow.camera.right = shadowD;
    keyLight.shadow.camera.top = shadowD;
    keyLight.shadow.camera.bottom = -shadowD;
    keyLight.shadow.bias = -0.0005;
    this.scene.add(keyLight);

    // Warm Fill Light (opposite side)
    const fillLight = new THREE.DirectionalLight('#93c5fd', 0.6);
    fillLight.position.set(-18, 14, -14);
    this.scene.add(fillLight);

    // Holotable teal/violet accent light
    const holoLight = new THREE.PointLight('#10b981', 2.0, 10);
    holoLight.position.set(9.5, 2.5, 0);
    this.scene.add(holoLight);

    // Violet accent wash
    const violetLight = new THREE.PointLight('#8b5cf6', 1.5, 12);
    violetLight.position.set(-8, 3, -6.5);
    this.scene.add(violetLight);
  }

  setupArchitecture() {
    // 1. Expansive Studio Horizon Floor (fills the entire screen seamlessly)
    const outerFloorGeo = new THREE.PlaneGeometry(240, 240);
    const outerFloorMat = new THREE.MeshStandardMaterial({
      color: '#121216',
      roughness: 0.9,
      metalness: 0.05,
    });
    const outerFloor = new THREE.Mesh(outerFloorGeo, outerFloorMat);
    outerFloor.rotation.x = -Math.PI / 2;
    outerFloor.position.y = -0.35;
    outerFloor.receiveShadow = true;
    this.scene.add(outerFloor);

    // Subtle outer architectural grid
    const outerGrid = new THREE.GridHelper(240, 60, '#26262e', '#18181f');
    outerGrid.position.y = -0.34;
    this.scene.add(outerGrid);

    // Floor Base Slab (top sits strictly at y = -0.02, below the office floor)
    const slabGeo = new THREE.BoxGeometry(ROOM.maxX * 2 + 1.2, 0.58, ROOM.maxZ * 2 + 1.2);
    const slabMat = new THREE.MeshStandardMaterial({ color: PALETTE.slab, roughness: 0.9 });
    const slab = new THREE.Mesh(slabGeo, slabMat);
    slab.position.y = -0.31; // top face = -0.31 + 0.29 = -0.02
    slab.receiveShadow = true;
    this.scene.add(slab);

    // 2. Main Office Floor (Warm Architectural Studio at y = 0.005 with polygonOffset)
    const floorGeo = new THREE.PlaneGeometry(ROOM.maxX * 2, ROOM.maxZ * 2);
    const floorMat = new THREE.MeshStandardMaterial({
      color: PALETTE.floor,
      roughness: 0.65,
      metalness: 0.08,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0.005;
    floor.receiveShadow = true;
    this.scene.add(floor);
    this.floorPlane = floor;

    // Architectural floor tile grid lines inside office (at y = 0.015 with polygonOffset)
    const gridHelper = new THREE.GridHelper(ROOM.maxX * 2, 32, '#a89f91', '#ded7cc');
    gridHelper.position.y = 0.015;
    if (gridHelper.material) {
      gridHelper.material.polygonOffset = true;
      gridHelper.material.polygonOffsetFactor = -2;
      gridHelper.material.polygonOffsetUnits = -2;
    }
    this.scene.add(gridHelper);

    // Modern low back walls (aesthetic studio backdrop)
    const wallMat = new THREE.MeshStandardMaterial({ color: PALETTE.wall, roughness: 0.85 });
    const trimMat = new THREE.MeshStandardMaterial({ color: PALETTE.wallTrim, roughness: 0.7 });

    // North wall (Z = minZ)
    const wallNGeo = new THREE.BoxGeometry(ROOM.maxX * 2, ROOM.wallH, 0.4);
    const wallN = new THREE.Mesh(wallNGeo, wallMat);
    wallN.position.set(0, ROOM.wallH / 2, ROOM.minZ);
    wallN.receiveShadow = true;
    this.scene.add(wallN);

    // West wall (X = minX)
    const wallWGeo = new THREE.BoxGeometry(0.4, ROOM.wallH, ROOM.maxZ * 2);
    const wallW = new THREE.Mesh(wallWGeo, wallMat);
    wallW.position.set(ROOM.minX, ROOM.wallH / 2, 0);
    wallW.receiveShadow = true;
    this.scene.add(wallW);

    // Wall baseboards
    const trimN = new THREE.Mesh(new THREE.BoxGeometry(ROOM.maxX * 2, 0.25, 0.46), trimMat);
    trimN.position.set(0, 0.125, ROOM.minZ);
    this.scene.add(trimN);

    const trimW = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.25, ROOM.maxZ * 2), trimMat);
    trimW.position.set(ROOM.minX, 0.125, 0);
    this.scene.add(trimW);

    // "KANTOR RAFFA" Neon Sign on back wall
    this.setupWallBranding();
  }

  setupWallBranding() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#e6e0d6';
    ctx.fillRect(0, 0, 1024, 256);

    ctx.fillStyle = '#09090b';
    ctx.font = 'bold 56px "Inter", sans-serif';
    ctx.fillText('KANTOR RAFFA', 50, 105);

    ctx.fillStyle = '#71717a';
    ctx.font = '500 24px "JetBrains Mono", monospace';
    ctx.fillText('AUTONOMOUS AI MISSION CONTROL · 6 AGENTS DEPLOYED', 50, 160);

    // Emerald gradient stripe
    const grad = ctx.createLinearGradient(50, 190, 500, 190);
    grad.addColorStop(0, '#10b981');
    grad.addColorStop(1, '#8b5cf6');
    ctx.fillStyle = grad;
    ctx.fillRect(50, 185, 420, 6);

    const tex = new THREE.CanvasTexture(canvas);
    const signMat = new THREE.MeshBasicMaterial({ map: tex });
    const signGeo = new THREE.PlaneGeometry(8, 2);
    const signMesh = new THREE.Mesh(signGeo, signMat);
    signMesh.position.set(-6, 2.6, ROOM.minZ + 0.22);
    this.scene.add(signMesh);
  }

  setupWorkstations() {
    AGENTS.forEach((agent) => {
      const group = new THREE.Group();
      group.position.set(agent.desk.x, 0, agent.desk.z);
      group.rotation.y = agent.desk.rot;

      // Desk geometry
      const deskW = 2.4;
      const deskD = 1.3;
      const deskH = 0.9;
      const topThick = 0.08;

      // Tabletop (clean matte finish)
      const topGeo = new THREE.BoxGeometry(deskW, topThick, deskD);
      const topMat = new THREE.MeshStandardMaterial({ color: PALETTE.desk, roughness: 0.4, metalness: 0.05 });
      const top = new THREE.Mesh(topGeo, topMat);
      top.position.y = deskH - topThick / 2;
      top.castShadow = true;
      top.receiveShadow = true;
      group.add(top);

      // Desk legs (matte dark metal)
      const legGeo = new THREE.BoxGeometry(0.08, deskH - topThick, 0.08);
      const legMat = new THREE.MeshStandardMaterial({ color: PALETTE.deskLeg, roughness: 0.6, metalness: 0.8 });
      const legOffsets = [
        [-deskW / 2 + 0.12, (deskH - topThick) / 2, -deskD / 2 + 0.12],
        [deskW / 2 - 0.12, (deskH - topThick) / 2, -deskD / 2 + 0.12],
        [-deskW / 2 + 0.12, (deskH - topThick) / 2, deskD / 2 - 0.12],
        [deskW / 2 - 0.12, (deskH - topThick) / 2, deskD / 2 - 0.12],
      ];
      legOffsets.forEach(([lx, ly, lz]) => {
        const leg = new THREE.Mesh(legGeo, legMat);
        leg.position.set(lx, ly, lz);
        leg.castShadow = true;
        group.add(leg);
      });

      // Desk Mat / Mousepad
      const padGeo = new THREE.BoxGeometry(1.4, 0.01, 0.7);
      const padMat = new THREE.MeshStandardMaterial({ color: '#27272a', roughness: 0.9 });
      const pad = new THREE.Mesh(padGeo, padMat);
      pad.position.set(0, deskH + 0.005, 0.05);
      group.add(pad);

      // Keyboard
      const kbGeo = new THREE.BoxGeometry(0.55, 0.02, 0.2);
      const kbMat = new THREE.MeshStandardMaterial({ color: '#18181b', roughness: 0.5 });
      const kb = new THREE.Mesh(kbGeo, kbMat);
      kb.position.set(-0.05, deskH + 0.015, 0.12);
      group.add(kb);

      // Mouse
      const mouseGeo = new THREE.BoxGeometry(0.07, 0.02, 0.1);
      const mouseMat = new THREE.MeshStandardMaterial({ color: '#3f3f46', roughness: 0.4 });
      const mouse = new THREE.Mesh(mouseGeo, mouseMat);
      mouse.position.set(0.35, deskH + 0.015, 0.12);
      group.add(mouse);

      // Dual Monitors
      const monW = 0.95;
      const monH = 0.58;
      const monD = 0.04;
      const monStandGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.35);
      const monStandMat = new THREE.MeshStandardMaterial({ color: '#27272a', metalness: 0.8 });

      // Left Monitor
      const leftMonGroup = new THREE.Group();
      leftMonGroup.position.set(-0.52, deskH + 0.45, -0.22);
      leftMonGroup.rotation.y = 0.15; // slightly angled toward worker

      const bezelMat = new THREE.MeshStandardMaterial({ color: '#09090b', roughness: 0.5 });
      const leftMonBezel = new THREE.Mesh(new THREE.BoxGeometry(monW, monH, monD), bezelMat);
      leftMonGroup.add(leftMonBezel);

      // Glowing screen with agent role color accent
      const screenMat1 = new THREE.MeshStandardMaterial({
        color: '#09090b',
        emissive: agent.color,
        emissiveIntensity: 0.4,
        roughness: 0.2,
      });
      const leftMonScreen = new THREE.Mesh(new THREE.PlaneGeometry(monW - 0.05, monH - 0.05), screenMat1);
      leftMonScreen.position.z = monD / 2 + 0.002;
      leftMonGroup.add(leftMonScreen);

      const standL = new THREE.Mesh(monStandGeo, monStandMat);
      standL.position.set(0, -0.25, -0.05);
      leftMonGroup.add(standL);
      group.add(leftMonGroup);

      // Right Monitor
      const rightMonGroup = new THREE.Group();
      rightMonGroup.position.set(0.52, deskH + 0.45, -0.22);
      rightMonGroup.rotation.y = -0.15;

      const rightMonBezel = new THREE.Mesh(new THREE.BoxGeometry(monW, monH, monD), bezelMat);
      rightMonGroup.add(rightMonBezel);

      const screenMat2 = new THREE.MeshStandardMaterial({
        color: '#09090b',
        emissive: '#38bdf8',
        emissiveIntensity: 0.35,
        roughness: 0.2,
      });
      const rightMonScreen = new THREE.Mesh(new THREE.PlaneGeometry(monW - 0.05, monH - 0.05), screenMat2);
      rightMonScreen.position.z = monD / 2 + 0.002;
      rightMonGroup.add(rightMonScreen);

      const standR = new THREE.Mesh(monStandGeo, monStandMat);
      standR.position.set(0, -0.25, -0.05);
      rightMonGroup.add(standR);
      group.add(rightMonGroup);

      // Ergonomic Chair
      const chairGroup = new THREE.Group();
      chairGroup.position.set(0, 0, 0.65);
      chairGroup.rotation.y = Math.PI; // facing desk

      const chairMat = new THREE.MeshStandardMaterial({ color: PALETTE.chair, roughness: 0.7 });
      // Seat
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.08, 0.65), chairMat);
      seat.position.y = 0.55;
      chairGroup.add(seat);
      // Backrest
      const backrest = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.7, 0.08), chairMat);
      backrest.position.set(0, 0.95, -0.28);
      chairGroup.add(backrest);
      // Chair base & stem
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5), monStandMat);
      stem.position.y = 0.26;
      chairGroup.add(stem);
      // Wheels star
      const wheelBase = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.04, 5), monStandMat);
      wheelBase.position.y = 0.05;
      chairGroup.add(wheelBase);
      group.add(chairGroup);

      // AI Worker Avatar (Seated, typing)
      const avatarGroup = new THREE.Group();
      avatarGroup.position.set(0, 0.56, 0.58);
      avatarGroup.rotation.y = Math.PI; // facing the desk

      const skinMat = new THREE.MeshStandardMaterial({ color: agent.look.skin, roughness: 0.7 });
      const clothesMat = new THREE.MeshStandardMaterial({ color: agent.look.shirt, roughness: 0.8 });
      const pantsMat = new THREE.MeshStandardMaterial({ color: agent.look.pants, roughness: 0.85 });
      const hairMat = new THREE.MeshStandardMaterial({ color: agent.look.hair, roughness: 0.9 });

      // Torso
      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.52, 0.28), clothesMat);
      torso.position.y = 0.32;
      torso.castShadow = true;
      avatarGroup.add(torso);

      // Head
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.32, 0.28), skinMat);
      head.position.y = 0.74;
      head.castShadow = true;
      avatarGroup.add(head);

      // Hair
      const hair = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.16, 0.32), hairMat);
      hair.position.set(0, 0.86, -0.02);
      avatarGroup.add(hair);

      // Role accessory (headphones, glasses, beanie, etc.)
      if (agent.look.accessory === 'headphones') {
        const hpMat = new THREE.MeshStandardMaterial({ color: '#10b981', metalness: 0.6 });
        const band = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.025, 8, 16, Math.PI), hpMat);
        band.position.set(0, 0.85, 0);
        band.rotation.x = Math.PI / 2;
        avatarGroup.add(band);
      } else if (agent.look.accessory === 'beanie') {
        const beanie = new THREE.Mesh(new THREE.BoxGeometry(0.33, 0.18, 0.3), clothesMat);
        beanie.position.set(0, 0.87, 0);
        avatarGroup.add(beanie);
      }

      // Seated Thighs
      const thighL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.38), pantsMat);
      thighL.position.set(-0.13, 0.05, 0.18);
      avatarGroup.add(thighL);
      const thighR = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.38), pantsMat);
      thighR.position.set(0.13, 0.05, 0.18);
      avatarGroup.add(thighR);

      // Typing Arms (animated in tick)
      const armMat = clothesMat;
      const armL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.3, 0.1), armMat);
      armL.position.set(-0.27, 0.28, 0.12);
      armL.rotation.x = -Math.PI / 3;
      avatarGroup.add(armL);

      const armR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.3, 0.1), armMat);
      armR.position.set(0.27, 0.28, 0.12);
      armR.rotation.x = -Math.PI / 3;
      avatarGroup.add(armR);

      group.add(avatarGroup);

      // Floating 3D Canvas Status Badge
      const badgeObj = this.createAgentBadge(agent);
      badgeObj.sprite.position.set(0, 2.3, 0.3);
      group.add(badgeObj.sprite);

      // Click hit target for desk interaction (generous bounds for easy clicking)
      const hitBox = new THREE.Mesh(
        new THREE.BoxGeometry(deskW + 1.4, 2.8, deskD + 1.8),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      hitBox.position.set(0, 1.2, 0.2);
      hitBox.userData = { agentId: agent.id, deskPos: new THREE.Vector3(agent.desk.x, 0, agent.desk.z) };
      group.add(hitBox);
      this.interactiveMeshes.push(hitBox);

      this.scene.add(group);

      this.agentMeshes.set(agent.id, {
        group,
        avatar: avatarGroup,
        armL,
        armR,
        head,
        badgeSprite: badgeObj.sprite,
        canvas: badgeObj.canvas,
        ctx: badgeObj.ctx,
        texture: badgeObj.texture,
        agent,
        deskPos: new THREE.Vector3(agent.desk.x, 0, agent.desk.z),
        status: 'Idle',
      });
    });
  }

  createAgentBadge(agent) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 160;
    const ctx = canvas.getContext('2d');

    this.renderBadgeCanvas(ctx, agent, 'Idle', agent.color);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(2.4, 0.75, 1);

    return { sprite, canvas, ctx, texture };
  }

  renderBadgeCanvas(ctx, agent, statusText, statusColor) {
    ctx.clearRect(0, 0, 512, 160);

    // Pill background
    ctx.fillStyle = 'rgba(9, 9, 11, 0.88)';
    ctx.beginPath();
    ctx.roundRect(16, 16, 480, 128, 28);
    ctx.fill();

    // Border with agent color accent
    ctx.strokeStyle = statusColor || agent.color;
    ctx.lineWidth = 4;
    ctx.stroke();

    // Role circle indicator
    ctx.fillStyle = statusColor || agent.color;
    ctx.beginPath();
    ctx.arc(60, 80, 20, 0, Math.PI * 2);
    ctx.fill();

    // Name & Role
    ctx.fillStyle = '#f4f4f5';
    ctx.font = 'bold 36px "Inter", sans-serif';
    ctx.fillText(agent.name, 96, 68);

    ctx.fillStyle = '#a1a1aa';
    ctx.font = '500 22px "Inter", sans-serif';
    ctx.fillText(agent.role, 96, 102);

    // Status pill on right
    ctx.fillStyle = statusColor || agent.color;
    ctx.font = 'bold 20px "JetBrains Mono", monospace';
    const statusW = ctx.measureText(statusText.toUpperCase()).width;
    ctx.fillText(statusText.toUpperCase(), 460 - statusW, 88);
  }

  updateAgentStatus(agentId, statusText, color) {
    const item = this.agentMeshes.get(agentId);
    if (!item) return;
    item.status = statusText;
    this.renderBadgeCanvas(item.ctx, item.agent, statusText, color || item.agent.color);
    item.texture.needsUpdate = true;
  }

  setupHolotable() {
    // War-room holographic planning table in corner / side (X = 9.5, Z = 0)
    const holoGroup = new THREE.Group();
    holoGroup.position.set(9.5, 0, 0);

    // Matte dark pedestal
    const baseGeo = new THREE.CylinderGeometry(1.6, 2.0, 0.9, 16);
    const baseMat = new THREE.MeshStandardMaterial({ color: '#18181b', roughness: 0.3, metalness: 0.8 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.45;
    base.castShadow = true;
    holoGroup.add(base);

    // Table rim glass glow
    const rimGeo = new THREE.TorusGeometry(1.65, 0.08, 12, 32);
    const rimMat = new THREE.MeshStandardMaterial({
      color: '#10b981',
      emissive: '#10b981',
      emissiveIntensity: 0.8,
    });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.position.y = 0.92;
    rim.rotation.x = Math.PI / 2;
    holoGroup.add(rim);

    // Concentric holographic rings
    const ringMat = new THREE.MeshBasicMaterial({
      color: '#34d399',
      wireframe: true,
      transparent: true,
      opacity: 0.7,
    });

    const ring1 = new THREE.Mesh(new THREE.RingGeometry(0.3, 1.4, 24), ringMat);
    ring1.rotation.x = -Math.PI / 2;
    ring1.position.y = 1.15;
    holoGroup.add(ring1);
    this.holoElements.push({ mesh: ring1, rotSpeed: 0.015 });

    const ring2 = new THREE.Mesh(new THREE.RingGeometry(0.5, 1.1, 16), ringMat);
    ring2.rotation.x = -Math.PI / 2;
    ring2.position.y = 1.35;
    holoGroup.add(ring2);
    this.holoElements.push({ mesh: ring2, rotSpeed: -0.02 });

    // Floating central holographic icosahedron
    const coreGeo = new THREE.IcosahedronGeometry(0.38, 1);
    const coreMat = new THREE.MeshStandardMaterial({
      color: '#10b981',
      emissive: '#059669',
      emissiveIntensity: 1.2,
      wireframe: true,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.position.y = 1.6;
    holoGroup.add(core);
    this.holoElements.push({ mesh: core, rotSpeed: 0.03, float: true });

    this.scene.add(holoGroup);
  }

  setupPlayer() {
    // Raffa: The Boss
    const group = new THREE.Group();
    group.position.copy(this.playerPos);

    const skinMat = new THREE.MeshStandardMaterial({ color: BOSS.look.skin, roughness: 0.7 });
    const suitMat = new THREE.MeshStandardMaterial({ color: '#18181b', roughness: 0.6 });
    const shirtMat = new THREE.MeshStandardMaterial({ color: '#10b981', roughness: 0.5 });
    const hairMat = new THREE.MeshStandardMaterial({ color: '#09090b', roughness: 0.9 });
    const crownMat = new THREE.MeshStandardMaterial({ color: '#fbbf24', metalness: 0.9, roughness: 0.2 });

    // Torso (Dark sharp suit with emerald tie)
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.65, 0.32), suitMat);
    torso.position.y = 0.85;
    torso.castShadow = true;
    group.add(torso);

    // Emerald lapel / tie stripe
    const tie = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.4, 0.02), shirtMat);
    tie.position.set(0, 0.86, 0.17);
    group.add(tie);

    // Head
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.36, 0.32), skinMat);
    head.position.y = 1.35;
    head.castShadow = true;
    group.add(head);

    // Hair
    const hair = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.14, 0.36), hairMat);
    hair.position.set(0, 1.52, -0.02);
    group.add(hair);

    // Golden Boss Crown
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.18, 0.12, 5), crownMat);
    crown.position.set(0, 1.64, 0);
    group.add(crown);

    // Left & Right Legs (pivot at hips)
    const legGeo = new THREE.BoxGeometry(0.16, 0.55, 0.16);
    const legL = new THREE.Mesh(legGeo, suitMat);
    legL.position.set(-0.15, 0.28, 0);
    legL.castShadow = true;
    group.add(legL);

    const legR = new THREE.Mesh(legGeo, suitMat);
    legR.position.set(0.15, 0.28, 0);
    legR.castShadow = true;
    group.add(legR);

    // Left & Right Arms
    const armGeo = new THREE.BoxGeometry(0.13, 0.55, 0.14);
    const armL = new THREE.Mesh(armGeo, suitMat);
    armL.position.set(-0.35, 0.82, 0);
    armL.castShadow = true;
    group.add(armL);

    const armR = new THREE.Mesh(armGeo, suitMat);
    armR.position.set(0.35, 0.82, 0);
    armR.castShadow = true;
    group.add(armR);

    // Floating "Raffa (Boss)" nameplate
    const tagCanvas = document.createElement('canvas');
    tagCanvas.width = 256;
    tagCanvas.height = 64;
    const tagCtx = tagCanvas.getContext('2d');
    tagCtx.fillStyle = 'rgba(16, 185, 129, 0.9)';
    tagCtx.beginPath();
    tagCtx.roundRect(8, 8, 240, 48, 12);
    tagCtx.fill();
    tagCtx.fillStyle = '#09090b';
    tagCtx.font = 'bold 24px "Inter", sans-serif';
    tagCtx.textAlign = 'center';
    tagCtx.fillText('👑 RAFFA (BOSS)', 128, 40);

    const tagTex = new THREE.CanvasTexture(tagCanvas);
    const tagSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tagTex, transparent: true }));
    tagSprite.scale.set(1.5, 0.4, 1);
    tagSprite.position.y = 2.0;
    group.add(tagSprite);

    this.scene.add(group);
    this.player = group;
    this.playerParts = { torso, head, legL, legR, armL, armR, crown };
  }

  setupDestRing() {
    // Pulse ring showing destination on click-to-move
    const ringGeo = new THREE.RingGeometry(0.35, 0.45, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: '#10b981',
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
    });
    this.destRing = new THREE.Mesh(ringGeo, ringMat);
    this.destRing.rotation.x = -Math.PI / 2;
    this.destRing.position.y = 0.02;
    this.scene.add(this.destRing);
  }

  setupProps() {
    // Indoor plants in corners
    const plantLocations = [
      [-14.5, -10.5],
      [14.5, -10.5],
      [-14.5, 10.5],
      [14.5, 10.5],
      [-0.5, -10.8],
    ];

    plantLocations.forEach(([px, pz]) => {
      const potGroup = new THREE.Group();
      potGroup.position.set(px, 0, pz);

      // Ceramic pot
      const potGeo = new THREE.CylinderGeometry(0.4, 0.3, 0.7, 12);
      const potMat = new THREE.MeshStandardMaterial({ color: '#f4f4f5', roughness: 0.4 });
      const pot = new THREE.Mesh(potGeo, potMat);
      pot.position.y = 0.35;
      pot.castShadow = true;
      potGroup.add(pot);

      // Plant foliage (monstera / snake plant leaves)
      const leafMat = new THREE.MeshStandardMaterial({ color: '#15803d', roughness: 0.6 });
      for (let i = 0; i < 6; i++) {
        const leafGeo = new THREE.ConeGeometry(0.18, 0.8 + (i % 3) * 0.2, 4);
        const leaf = new THREE.Mesh(leafGeo, leafMat);
        const angle = (i / 6) * Math.PI * 2;
        leaf.position.set(Math.cos(angle) * 0.15, 0.8 + (i % 2) * 0.1, Math.sin(angle) * 0.15);
        leaf.rotation.x = (Math.random() - 0.5) * 0.3;
        leaf.rotation.z = (Math.random() - 0.5) * 0.3;
        potGroup.add(leaf);
      }

      this.scene.add(potGroup);
    });
  }

  setupEvents() {
    this.onPointerDown = this.handlePointerDown.bind(this);
    this.onWheel = this.handleWheel.bind(this);
    this.onResize = this.handleResize.bind(this);

    this.renderer.domElement.addEventListener('pointerdown', this.onPointerDown);
    this.renderer.domElement.addEventListener('wheel', this.onWheel, { passive: true });
    window.addEventListener('resize', this.onResize);
  }

  handlePointerDown(event) {
    if (event.button !== 0) return; // primary left click only

    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    // 1. Check if clicked an interactive desk
    const deskIntersects = this.raycaster.intersectObjects(this.interactiveMeshes, false);
    if (deskIntersects.length > 0) {
      const hit = deskIntersects[0];
      const agentId = hit.object.userData.agentId;
      const deskPos = hit.object.userData.deskPos;
      if (agentId) {
        // Move player near desk & trigger callback
        this.setDestination(deskPos.x, deskPos.z + 1.2);
        this.onDeskClicked(agentId);
        return;
      }
    }

    // 2. Click-to-move on floor plane
    const floorIntersects = this.raycaster.intersectObject(this.floorPlane, false);
    if (floorIntersects.length > 0) {
      const hit = floorIntersects[0];
      this.setDestination(hit.point.x, hit.point.z);
    }
  }

  setDestination(x, z) {
    // Clamp to room bounds
    const cx = Math.max(ROOM.minX + 1.2, Math.min(ROOM.maxX - 1.2, x));
    const cz = Math.max(ROOM.minZ + 1.2, Math.min(ROOM.maxZ - 1.2, z));

    this.playerTargetPos = new THREE.Vector3(cx, 0, cz);

    if (this.destRing) {
      this.destRing.position.set(cx, 0.02, cz);
      this.destRing.material.opacity = 0.9;
      this.destRing.scale.set(0.6, 0.6, 0.6);
    }
  }

  handleWheel(event) {
    // Zoom camera in/out
    this.targetZoom = Math.max(0.6, Math.min(1.8, this.targetZoom + event.deltaY * -0.001));
  }

  handleResize() {
    if (this.disposed || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    const aspect = width / height;

    const d = 10;
    this.camera.left = -d * aspect;
    this.camera.right = d * aspect;
    this.camera.top = d;
    this.camera.bottom = -d;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  }

  /**
   * Focus camera smoothly on a specific agent or return to Boss
   */
  focusOn(agentId) {
    if (!agentId || agentId === 'raffa') {
      this.focusingOnAgent = null;
      return;
    }
    const item = this.agentMeshes.get(agentId);
    if (item) {
      this.focusingOnAgent = item.deskPos;
    }
  }

  resetCamera() {
    this.focusingOnAgent = null;
    this.targetZoom = 1.0;
  }

  /**
   * Main render loop
   */
  animate() {
    if (this.disposed) return;
    this.animId = requestAnimationFrame(this.animate);

    const dt = Math.min(this.clock.getDelta(), 0.1);
    const elapsed = this.clock.getElapsedTime();

    // 1. Update Boss (WASD or Click-to-move)
    this.updatePlayerMovement(dt, elapsed);

    // 2. Animate AI agents typing & idle bobbing
    this.updateAgents(dt, elapsed);

    // 3. Animate Holotable
    this.updateHolotable(elapsed);

    // 4. Update Destination Ring pulse
    this.updateDestRing(dt);

    // 5. Update Camera target & smooth position
    this.updateCamera(dt);

    // 6. Proximity check with nearest agent
    this.checkProximity();

    // 7. Render
    this.renderer.render(this.scene, this.camera);
  }

  updatePlayerMovement(dt, elapsed) {
    if (!this.player) return;

    let moveX = 0;
    let moveZ = 0;
    let moving = false;

    // A. Check Click-to-Move Target
    if (this.playerTargetPos) {
      const dx = this.playerTargetPos.x - this.playerPos.x;
      const dz = this.playerTargetPos.z - this.playerPos.z;
      const dist = Math.hypot(dx, dz);

      if (dist > 0.15) {
        moving = true;
        moveX = dx / dist;
        moveZ = dz / dist;

        const spd = PLAYER.speed;
        this.playerPos.x += moveX * spd * dt;
        this.playerPos.z += moveZ * spd * dt;

        this.targetFacing = facingFromDirection(moveX, moveZ);
      } else {
        this.playerTargetPos = null;
      }
    }

    this.isMoving = moving;

    // Smooth facing rotation
    this.playerFacing = dampAngle(this.playerFacing, this.targetFacing, 14, dt);
    this.player.rotation.y = this.playerFacing;
    this.player.position.set(this.playerPos.x, 0, this.playerPos.z);

    // Walk cycle animation
    if (moving) {
      this.walkCycle += dt * 11;
      const swing = Math.sin(this.walkCycle) * 0.45;

      this.playerParts.legL.rotation.x = swing;
      this.playerParts.legR.rotation.x = -swing;
      this.playerParts.armL.rotation.x = -swing * 0.8;
      this.playerParts.armR.rotation.x = swing * 0.8;

      // Slight head & body bob
      this.playerParts.torso.position.y = 0.85 + Math.abs(Math.sin(this.walkCycle * 2)) * 0.04;
      this.playerParts.head.position.y = 1.35 + Math.abs(Math.sin(this.walkCycle * 2)) * 0.04;
    } else {
      // Idle return to neutral
      this.playerParts.legL.rotation.x *= 0.8;
      this.playerParts.legR.rotation.x *= 0.8;
      this.playerParts.armL.rotation.x *= 0.8;
      this.playerParts.armR.rotation.x *= 0.8;
      this.playerParts.torso.position.y = 0.85 + Math.sin(elapsed * 2) * 0.01;
      this.playerParts.head.position.y = 1.35 + Math.sin(elapsed * 2) * 0.01;
    }
  }

  /**
   * Called by external keyboard handler for WASD input
   */
  applyWASD(screenMoveX, screenMoveZ, isSprint, dt) {
    if (this.disposed || !this.player) return;

    // Cancel click-to-move if user presses WASD
    this.playerTargetPos = null;

    if (Math.abs(screenMoveX) > 0.01 || Math.abs(screenMoveZ) > 0.01) {
      // Convert screen-relative WASD to world coordinates using the spec's exact rotation
      const world = screenToWorld(screenMoveX, screenMoveZ, CAMERA_YAW);

      const spd = PLAYER.speed * (isSprint ? PLAYER.sprint : 1.0);
      const nextX = this.playerPos.x + world.x * spd * dt;
      const nextZ = this.playerPos.z + world.z * spd * dt;

      // Clamp to room bounds
      this.playerPos.x = Math.max(ROOM.minX + 1.2, Math.min(ROOM.maxX - 1.2, nextX));
      this.playerPos.z = Math.max(ROOM.minZ + 1.2, Math.min(ROOM.maxZ - 1.2, nextZ));

      this.targetFacing = facingFromDirection(world.x, world.z);
      this.isMoving = true;

      // Walk cycle
      this.walkCycle += dt * (isSprint ? 16 : 11);
      const swing = Math.sin(this.walkCycle) * 0.45;
      this.playerParts.legL.rotation.x = swing;
      this.playerParts.legR.rotation.x = -swing;
      this.playerParts.armL.rotation.x = -swing * 0.8;
      this.playerParts.armR.rotation.x = swing * 0.8;
      this.playerParts.torso.position.y = 0.85 + Math.abs(Math.sin(this.walkCycle * 2)) * 0.04;
      this.playerParts.head.position.y = 1.35 + Math.abs(Math.sin(this.walkCycle * 2)) * 0.04;
    }
  }

  updateAgents(dt, elapsed) {
    this.agentMeshes.forEach((item, id) => {
      // Typing animation speed based on status
      const isWorking = item.status !== 'Idle';
      const speed = isWorking ? 14 : 4;
      const typingOffset = id.charCodeAt(0) * 0.5;

      const armSwing = Math.sin(elapsed * speed + typingOffset) * (isWorking ? 0.22 : 0.08);
      item.armL.rotation.x = -Math.PI / 3 + armSwing;
      item.armR.rotation.x = -Math.PI / 3 - armSwing;

      // Gentle head bob / looking at screens
      item.head.rotation.y = Math.sin(elapsed * 1.5 + typingOffset) * 0.12;

      // Floating status badge gentle floating bob
      item.badgeSprite.position.y = 2.3 + Math.sin(elapsed * 2.5 + typingOffset) * 0.06;
    });
  }

  updateHolotable(elapsed) {
    this.holoElements.forEach((el) => {
      if (el.mesh) {
        el.mesh.rotation.z += el.rotSpeed;
        if (el.float) {
          el.mesh.rotation.x += el.rotSpeed * 0.8;
          el.mesh.position.y = 1.6 + Math.sin(elapsed * 2.5) * 0.08;
        }
      }
    });
  }

  updateDestRing(dt) {
    if (!this.destRing || this.destRing.material.opacity <= 0.01) return;

    this.destRing.material.opacity = Math.max(0, this.destRing.material.opacity - dt * 1.8);
    const s = this.destRing.scale.x + dt * 1.2;
    this.destRing.scale.set(s, s, s);
  }

  updateCamera(dt) {
    // Zoom interpolation
    this.zoomLevel += (this.targetZoom - this.zoomLevel) * 0.1;
    this.camera.zoom = this.zoomLevel;
    this.camera.updateProjectionMatrix();

    // Camera target: focus on selected agent desk or subtle parallax follow of Raffa
    let targetLook;
    if (this.focusingOnAgent) {
      targetLook = this.focusingOnAgent;
    } else {
      // Keep center of the office in view with subtle parallax follow (0.35 factor)
      targetLook = new THREE.Vector3(
        this.playerPos.x * 0.32,
        0,
        this.playerPos.z * 0.32
      );
    }

    // Smooth lerp camera focus
    this.camCurrentLook.lerp(targetLook, 0.08);

    // Keep camera at diagonal isometric offset relative to target
    this.camera.position.set(
      this.camCurrentLook.x + CAMERA_OFFSET.x,
      this.camCurrentLook.y + CAMERA_OFFSET.y,
      this.camCurrentLook.z + CAMERA_OFFSET.z
    );
    this.camera.lookAt(this.camCurrentLook);
  }

  setTheme(isLight) {
    if (!this.scene) return;
    const bgCol = isLight ? '#f1f5f9' : '#0c0c0e';
    this.scene.background = new THREE.Color(bgCol);
    if (this.scene.fog) {
      this.scene.fog.color = new THREE.Color(bgCol);
      this.scene.fog.density = isLight ? 0.008 : 0.015;
    }
  }

  checkProximity() {
    let nearestAgent = null;
    let minDist = 4.5;

    this.agentMeshes.forEach((item) => {
      const dist = this.playerPos.distanceTo(item.deskPos);
      if (dist < minDist) {
        minDist = dist;
        nearestAgent = item.agent;
      }
    });

    if (nearestAgent) {
      this.onInteractPrompt(nearestAgent);
    } else {
      this.onInteractPrompt(null);
    }
  }

  destroy() {
    this.disposed = true;
    if (this.animId) cancelAnimationFrame(this.animId);

    if (this.renderer && this.renderer.domElement) {
      this.renderer.domElement.removeEventListener('pointerdown', this.onPointerDown);
      this.renderer.domElement.removeEventListener('wheel', this.onWheel);
      window.removeEventListener('resize', this.onResize);
      if (this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
      this.renderer.dispose();
    }
  }
}
