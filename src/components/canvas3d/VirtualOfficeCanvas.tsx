import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { useAgentStore } from '../../store/useAgentStore';
import type { CameraPreset } from '../../types/agent';
import { Camera, Eye, Layers, RotateCcw, Server } from 'lucide-react';

export const VirtualOfficeCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Zustand Store selectors
  const cameraPreset = useAgentStore((state) => state.cameraPreset);
  const setCameraPreset = useAgentStore((state) => state.setCameraPreset);
  const initAudio = useAgentStore((state) => state.initAudio);

  // Camera targets for smooth interpolation
  const cameraPresetsConfig: Record<CameraPreset, { pos: THREE.Vector3; target: THREE.Vector3 }> = {
    ISOMETRIC: {
      pos: new THREE.Vector3(9.2, 7.5, 9.2),
      target: new THREE.Vector3(0, 1.4, 0),
    },
    DESK: {
      pos: new THREE.Vector3(2.6, 2.4, 3.2),
      target: new THREE.Vector3(0, 1.8, 0.1),
    },
    SERVER: {
      pos: new THREE.Vector3(-3.8, 3.0, 1.2),
      target: new THREE.Vector3(-3.6, 2.4, -2.4),
    },
    TOP: {
      pos: new THREE.Vector3(0.01, 13.0, 0.01),
      target: new THREE.Vector3(0, 0, 0),
    },
  };

  const [activeCamName, setActiveCamName] = useState<CameraPreset>('ISOMETRIC');
  const [showControlsHint, setShowControlsHint] = useState(true);

  // References to 3D scene dynamic elements
  const sceneStateRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;
    // 3 Dedicated Monitor Canvases
    centerCanvas: HTMLCanvasElement;
    centerCtx: CanvasRenderingContext2D;
    centerTexture: THREE.CanvasTexture;
    leftCanvas: HTMLCanvasElement;
    leftCtx: CanvasRenderingContext2D;
    leftTexture: THREE.CanvasTexture;
    rightCanvas: HTMLCanvasElement;
    rightCtx: CanvasRenderingContext2D;
    rightTexture: THREE.CanvasTexture;
    serverLeds: THREE.Mesh[];
    robotParts: {
      avatarGroup: THREE.Group;
      head: THREE.Group;
      torso: THREE.Group;
      visor: THREE.Mesh;
      reactor: THREE.Mesh;
      reactorLight: THREE.PointLight;
      leftArm: THREE.Group;
      rightArm: THREE.Group;
      leftHand: THREE.Mesh;
      rightHand: THREE.Mesh;
    };
    hologramBeam: THREE.Group;
    hologramLight: THREE.PointLight;
    steamParticles: THREE.Points;
    confettiParticles: THREE.Points;
    confettiVelocities: THREE.Vector3[];
    confettiActive: boolean;
    confettiTimer: number;
    clock: THREE.Clock;
    targetCamPos: THREE.Vector3;
    targetCamLookAt: THREE.Vector3;
    currentCamLookAt: THREE.Vector3;
    animFrameId: number;
  } | null>(null);

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x05070f);
    scene.fog = new THREE.FogExp2(0x05070f, 0.024);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    const initialConfig = cameraPresetsConfig.ISOMETRIC;
    camera.position.copy(initialConfig.pos);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.copy(initialConfig.target);
    controls.maxPolarAngle = Math.PI / 2.05;
    controls.minDistance = 3.2;
    controls.maxDistance = 22;

    // 5. Dynamic 2D Canvases for 3 Monitors
    // Center Screen: Code Stream & Terminal
    const centerCanvas = document.createElement('canvas');
    centerCanvas.width = 1024;
    centerCanvas.height = 512;
    const centerCtx = centerCanvas.getContext('2d')!;
    const centerTexture = new THREE.CanvasTexture(centerCanvas);

    // Left Screen: Telemetry & Neural Graph
    const leftCanvas = document.createElement('canvas');
    leftCanvas.width = 512;
    leftCanvas.height = 512;
    const leftCtx = leftCanvas.getContext('2d')!;
    const leftTexture = new THREE.CanvasTexture(leftCanvas);

    // Right Screen: CI/CD Pipeline & Test Assertions
    const rightCanvas = document.createElement('canvas');
    rightCanvas.width = 512;
    rightCanvas.height = 512;
    const rightCtx = rightCanvas.getContext('2d')!;
    const rightTexture = new THREE.CanvasTexture(rightCanvas);

    // 6. Lighting Setup
    const ambientLight = new THREE.AmbientLight(0x16172e, 1.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xe2e8f0, 2.0);
    dirLight.position.set(7, 13, 7);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.bias = -0.0004;
    scene.add(dirLight);

    // Cyan Neon Rim Light
    const cyanRim = new THREE.PointLight(0x06b6d4, 3.6, 18);
    cyanRim.position.set(-6, 4.5, 4.5);
    scene.add(cyanRim);

    // Magenta Neon Rim Light
    const magentaRim = new THREE.PointLight(0xec4899, 3.2, 18);
    magentaRim.position.set(6, 4.2, -4.5);
    scene.add(magentaRim);

    // Desk Lamp Light
    const deskLampLight = new THREE.SpotLight(0xfff3d6, 3.5, 7, 0.65, 0.4);
    deskLampLight.position.set(1.7, 2.5, 0.35);
    deskLampLight.target.position.set(-0.15, 1.44, 0.35);
    deskLampLight.castShadow = true;
    scene.add(deskLampLight);
    scene.add(deskLampLight.target);

    // 7. ENVIRONMENT ASSETS

    // Floor
    const floorGeo = new THREE.BoxGeometry(16, 0.4, 16);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x090c17,
      roughness: 0.35,
      metalness: 0.8,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = -0.2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Grid Floor Overlay
    const gridHelper = new THREE.GridHelper(16, 32, 0x06b6d4, 0x1e293b);
    gridHelper.position.y = 0.01;
    (gridHelper.material as THREE.Material).transparent = true;
    (gridHelper.material as THREE.Material).opacity = 0.4;
    scene.add(gridHelper);

    // Cyber Workstation Area Rug / Holographic Floor Plate
    const rugGeo = new THREE.BoxGeometry(5.6, 0.02, 4.2);
    const rugMat = new THREE.MeshStandardMaterial({ color: 0x0d1322, roughness: 0.6, metalness: 0.5 });
    const rug = new THREE.Mesh(rugGeo, rugMat);
    rug.position.set(0, 0.01, 0.6);
    rug.receiveShadow = true;
    scene.add(rug);

    // Glowing Neon Edge around rug
    const rugEdgeGeo = new THREE.BoxGeometry(5.68, 0.03, 4.28);
    const rugEdgeMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
    const rugEdge = new THREE.Mesh(rugEdgeGeo, rugEdgeMat);
    rugEdge.position.set(0, 0.005, 0.6);
    scene.add(rugEdge);

    // Back Left Wall
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x090d18, roughness: 0.85, metalness: 0.2 });
    const backWallLeft = new THREE.Mesh(new THREE.BoxGeometry(0.4, 7, 16), wallMat);
    backWallLeft.position.set(-8, 3.5, 0);
    backWallLeft.receiveShadow = true;
    scene.add(backWallLeft);

    // Back Rear Wall
    const backWallRear = new THREE.Mesh(new THREE.BoxGeometry(16, 7, 0.4), wallMat);
    backWallRear.position.set(0, 3.5, -8);
    backWallRear.receiveShadow = true;
    scene.add(backWallRear);

    // Wall Neon Strips
    const neonMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
    const strip1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 6.2, 0.06), neonMat);
    strip1.position.set(-7.75, 3.5, -3);
    const strip2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 6.2, 0.06), neonMat);
    strip2.position.set(-7.75, 3.5, 3);
    scene.add(strip1, strip2);

    // Neon Wall Sign: "DEVFLOW // NEURAL OPERATOR"
    const signGroup = new THREE.Group();
    const signBack = new THREE.Mesh(
      new THREE.BoxGeometry(4.8, 0.8, 0.05),
      new THREE.MeshStandardMaterial({ color: 0x080c18, metalness: 0.9 })
    );
    signBack.position.set(-2, 5.6, -7.75);
    signGroup.add(signBack);

    const signTrim = new THREE.Mesh(
      new THREE.BoxGeometry(4.9, 0.88, 0.03),
      new THREE.MeshBasicMaterial({ color: 0xec4899 })
    );
    signTrim.position.set(-2, 5.6, -7.77);
    signGroup.add(signTrim);
    scene.add(signGroup);

    // Skyline Window
    const winFrameMat = new THREE.MeshStandardMaterial({ color: 0x111625, metalness: 0.9, roughness: 0.2 });
    const windowFrame = new THREE.Mesh(new THREE.BoxGeometry(6.8, 4.4, 0.2), winFrameMat);
    windowFrame.position.set(3.4, 3.6, -7.8);
    scene.add(windowFrame);

    const winGlass = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 4.0), new THREE.MeshBasicMaterial({ color: 0x04060d }));
    winGlass.position.set(3.4, 3.6, -7.68);
    scene.add(winGlass);

    // High-rise City Silhouettes
    const buildingMat = new THREE.MeshBasicMaterial({ color: 0x080f1d });
    const skylineGroup = new THREE.Group();
    const heights = [3.2, 4.1, 2.5, 4.6, 3.4, 4.9, 2.8];
    heights.forEach((h, i) => {
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.8, h, 0.05), buildingMat);
      b.position.set(-2.2 + i * 0.8, 1.8 + h / 2, -7.65);
      skylineGroup.add(b);

      const winDots = new THREE.Mesh(
        new THREE.PlaneGeometry(0.55, h * 0.72),
        new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? 0x06b6d4 : 0xec4899, wireframe: true })
      );
      winDots.position.set(-2.2 + i * 0.8, 1.8 + h / 2, -7.62);
      skylineGroup.add(winDots);
    });
    skylineGroup.position.set(3.4, 0, 0);
    scene.add(skylineGroup);

    // Central Workstation Desk
    const deskGroup = new THREE.Group();
    const deskTopGeo = new THREE.BoxGeometry(4.4, 0.12, 2.3);
    const deskTopMat = new THREE.MeshStandardMaterial({ color: 0x151928, metalness: 0.7, roughness: 0.25 });
    const deskTop = new THREE.Mesh(deskTopGeo, deskTopMat);
    deskTop.position.set(0, 1.35, 0);
    deskTop.castShadow = true;
    deskTop.receiveShadow = true;
    deskGroup.add(deskTop);

    // Glowing Neon Edge under desk
    const deskGlow = new THREE.Mesh(new THREE.BoxGeometry(4.44, 0.02, 2.34), new THREE.MeshBasicMaterial({ color: 0x06b6d4 }));
    deskGlow.position.set(0, 1.28, 0);
    deskGroup.add(deskGlow);

    // Desk Legs
    const legMat = new THREE.MeshStandardMaterial({ color: 0x0b0e17, metalness: 0.95, roughness: 0.2 });
    const legGeo = new THREE.BoxGeometry(0.14, 1.35, 1.9);
    const leftLeg = new THREE.Mesh(legGeo, legMat);
    leftLeg.position.set(-1.95, 0.675, 0);
    leftLeg.castShadow = true;
    const rightLeg = new THREE.Mesh(legGeo, legMat);
    rightLeg.position.set(1.95, 0.675, 0);
    rightLeg.castShadow = true;
    deskGroup.add(leftLeg, rightLeg);

    // Mousemat
    const mouseMat = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.015, 1.4), new THREE.MeshStandardMaterial({ color: 0x0b0f19, roughness: 0.9 }));
    mouseMat.position.set(0, 1.42, 0.15);
    deskGroup.add(mouseMat);

    // Mechanical Keyboard
    const kbGeo = new THREE.BoxGeometry(1.25, 0.04, 0.48);
    const kbMat = new THREE.MeshStandardMaterial({ color: 0x1e2433, metalness: 0.5, roughness: 0.4 });
    const keyboard = new THREE.Mesh(kbGeo, kbMat);
    keyboard.position.set(-0.15, 1.44, 0.35);
    keyboard.castShadow = true;
    deskGroup.add(keyboard);

    // Glowing key row
    const keyGlow = new THREE.Mesh(new THREE.BoxGeometry(1.16, 0.01, 0.4), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
    keyGlow.position.set(-0.15, 1.465, 0.35);
    deskGroup.add(keyGlow);

    // Ergonomic Mouse
    const mouse = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.05, 0.28), new THREE.MeshStandardMaterial({ color: 0x1f293d, metalness: 0.8 }));
    mouse.position.set(0.8, 1.44, 0.35);
    deskGroup.add(mouse);

    // Coffee Mug with Steam
    const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.25, 16), new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3 }));
    mug.position.set(1.45, 1.53, 0.4);
    mug.castShadow = true;
    deskGroup.add(mug);

    // Steam Particles
    const steamCount = 20;
    const steamGeo = new THREE.BufferGeometry();
    const steamPos = new Float32Array(steamCount * 3);
    for (let i = 0; i < steamCount; i++) {
      steamPos[i * 3] = 1.45 + (Math.random() - 0.5) * 0.08;
      steamPos[i * 3 + 1] = 1.65 + Math.random() * 0.4;
      steamPos[i * 3 + 2] = 0.4 + (Math.random() - 0.5) * 0.08;
    }
    steamGeo.setAttribute('position', new THREE.BufferAttribute(steamPos, 3));
    const steamMat = new THREE.PointsMaterial({ color: 0xe0f2fe, size: 0.06, transparent: true, opacity: 0.45 });
    const steamParticles = new THREE.Points(steamGeo, steamMat);
    deskGroup.add(steamParticles);

    // Desk Lamp (Positioned cleanly on the right side of the desk)
    const lampGroup = new THREE.Group();
    const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.04, 16), legMat);
    lampBase.position.set(1.9, 1.43, 0.65);
    lampGroup.add(lampBase);

    const lampArm = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.35, 8), legMat);
    lampArm.position.set(1.85, 2.05, 0.5);
    lampArm.rotation.x = -0.25;
    lampArm.rotation.z = 0.2;
    lampGroup.add(lampArm);

    const lampShade = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.3, 16), legMat);
    lampShade.position.set(1.7, 2.55, 0.35);
    lampShade.rotation.x = Math.PI - 0.45;
    lampShade.rotation.y = -0.4;
    lampGroup.add(lampShade);

    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), new THREE.MeshBasicMaterial({ color: 0xfffaed }));
    bulb.position.set(1.7, 2.5, 0.35);
    lampGroup.add(bulb);
    deskGroup.add(lampGroup);

    // TRIPLE-MONITOR BATTLE STATION
    const monitorMount = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.85, 12), legMat);
    monitorMount.position.set(0, 1.78, -0.75);
    deskGroup.add(monitorMount);

    const bezelMat = new THREE.MeshStandardMaterial({ color: 0x080b12, metalness: 0.85, roughness: 0.3 });

    // 1. Center Monitor (Code Stream Texture)
    const centerBezel = new THREE.Mesh(new THREE.BoxGeometry(2.35, 1.18, 0.06), bezelMat);
    centerBezel.position.set(0, 2.2, -0.65);
    deskGroup.add(centerBezel);

    const centerScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(2.26, 1.08),
      new THREE.MeshBasicMaterial({ map: centerTexture })
    );
    centerScreen.position.set(0, 2.2, -0.615);
    deskGroup.add(centerScreen);

    // 2. Left Monitor (Telemetry & Neural Wave Texture)
    const leftMonitor = new THREE.Group();
    const leftBezel = new THREE.Mesh(new THREE.BoxGeometry(1.22, 1.04, 0.05), bezelMat);
    leftMonitor.add(leftBezel);
    const leftScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(1.16, 0.98),
      new THREE.MeshBasicMaterial({ map: leftTexture })
    );
    leftScreen.position.z = 0.03;
    leftMonitor.add(leftScreen);
    leftMonitor.position.set(-1.7, 2.2, -0.38);
    leftMonitor.rotation.y = 0.42;
    deskGroup.add(leftMonitor);

    // 3. Right Monitor (CI/CD Pipeline & Tests Texture)
    const rightMonitor = new THREE.Group();
    const rightBezel = new THREE.Mesh(new THREE.BoxGeometry(1.22, 1.04, 0.05), bezelMat);
    rightMonitor.add(rightBezel);
    const rightScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(1.16, 0.98),
      new THREE.MeshBasicMaterial({ map: rightTexture })
    );
    rightScreen.position.z = 0.03;
    rightMonitor.add(rightScreen);
    rightMonitor.position.set(1.7, 2.2, -0.38);
    rightMonitor.rotation.y = -0.42;
    deskGroup.add(rightMonitor);

    scene.add(deskGroup);

    // Sleek Ergonomic Cyber Chair
    const chairGroup = new THREE.Group();
    const chairMat = new THREE.MeshStandardMaterial({ color: 0x111524, roughness: 0.4, metalness: 0.6 });
    const chairAccent = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });

    const seat = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.14, 0.95), chairMat);
    seat.position.set(0, 0.88, 1.15);
    chairGroup.add(seat);

    const backrest = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.3, 0.12), chairMat);
    backrest.position.set(0, 1.55, 1.58);
    backrest.rotation.x = -0.12;
    chairGroup.add(backrest);

    const spine = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.2, 0.04), chairAccent);
    spine.position.set(0, 1.55, 1.65);
    spine.rotation.x = -0.12;
    chairGroup.add(spine);

    const chairPiston = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.88, 12), legMat);
    chairPiston.position.set(0, 0.44, 1.15);
    chairGroup.add(chairPiston);

    const chairBase = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.58, 0.06, 5), legMat);
    chairBase.position.set(0, 0.06, 1.15);
    chairGroup.add(chairBase);
    scene.add(chairGroup);

    // Server Rack Cabinet with Blinking LEDs
    const serverGroup = new THREE.Group();
    const serverRack = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 5.2, 1.8),
      new THREE.MeshStandardMaterial({ color: 0x080b14, metalness: 0.9, roughness: 0.2 })
    );
    serverRack.position.set(-5.5, 2.6, -3.2);
    serverRack.castShadow = true;
    serverRack.receiveShadow = true;
    serverGroup.add(serverRack);

    const serverGlass = new THREE.Mesh(
      new THREE.PlaneGeometry(1.6, 4.8),
      new THREE.MeshStandardMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.25, roughness: 0.1 })
    );
    serverGlass.position.set(-4.59, 2.6, -3.2);
    serverGlass.rotation.y = Math.PI / 2;
    serverGroup.add(serverGlass);

    const serverLeds: THREE.Mesh[] = [];
    const ledColors = [0x06b6d4, 0x10b981, 0xf59e0b, 0xef4444, 0x38bdf8];
    for (let u = 0; u < 8; u++) {
      const y = 0.8 + u * 0.52;
      const blade = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 0.38, 1.5),
        new THREE.MeshStandardMaterial({ color: 0x141a29, metalness: 0.9 })
      );
      blade.position.set(-4.62, y, -3.2);
      serverGroup.add(blade);

      for (let l = 0; l < 4; l++) {
        const ledMat = new THREE.MeshBasicMaterial({ color: ledColors[(u * 2 + l) % ledColors.length] });
        const led = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.05, 0.06), ledMat);
        led.position.set(-4.58, y + 0.08, -3.6 + l * 0.26);
        serverGroup.add(led);
        serverLeds.push(led);
      }
    }
    scene.add(serverGroup);

    // Whiteboard / Kanban Board on Left Wall
    const kanbanGroup = new THREE.Group();
    const board = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 2.6, 4.2),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2, metalness: 0.4 })
    );
    board.position.set(-7.75, 3.4, 1.8);
    kanbanGroup.add(board);

    const boardFrame = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 2.7, 4.3),
      new THREE.MeshStandardMaterial({ color: 0x06b6d4, metalness: 0.8 })
    );
    boardFrame.position.set(-7.78, 3.4, 1.8);
    kanbanGroup.add(boardFrame);

    const stickyColors = [0x06b6d4, 0xf59e0b, 0xec4899, 0x10b981];
    const stickyPositions = [
      { y: 3.8, z: 0.6 },
      { y: 3.3, z: 0.6 },
      { y: 3.9, z: 1.8 },
      { y: 3.4, z: 1.8 },
      { y: 3.7, z: 3.0 },
    ];
    stickyPositions.forEach((pos, idx) => {
      const sticky = new THREE.Mesh(
        new THREE.PlaneGeometry(0.4, 0.35),
        new THREE.MeshBasicMaterial({ color: stickyColors[idx % stickyColors.length] })
      );
      sticky.position.set(-7.7, pos.y, pos.z);
      sticky.rotation.y = Math.PI / 2;
      kanbanGroup.add(sticky);
    });
    scene.add(kanbanGroup);

    // Indoor Cyberpunk Plant
    const plantGroup = new THREE.Group();
    const pot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.25, 0.65, 6),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.3, roughness: 0.8 })
    );
    pot.position.set(4.5, 0.325, 3.2);
    plantGroup.add(pot);

    const leafMat = new THREE.MeshStandardMaterial({ color: 0x059669, roughness: 0.6, side: THREE.DoubleSide });
    for (let i = 0; i < 7; i++) {
      const angle = (i / 7) * Math.PI * 2;
      const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.9, 4), leafMat);
      leaf.position.set(4.5 + Math.cos(angle) * 0.18, 0.85 + (i % 2) * 0.15, 3.2 + Math.sin(angle) * 0.18);
      leaf.rotation.x = Math.sin(angle) * 0.65;
      leaf.rotation.z = -Math.cos(angle) * 0.65;
      plantGroup.add(leaf);
    }
    scene.add(plantGroup);

    // Holographic Telemetry Emitter (Overhead Projector)
    const hologramBeam = new THREE.Group();
    hologramBeam.position.set(0, 3.8, 0);

    const emitterRing = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.04, 8, 32), new THREE.MeshBasicMaterial({ color: 0x06b6d4 }));
    emitterRing.rotation.x = Math.PI / 2;
    hologramBeam.add(emitterRing);

    const innerRing = new THREE.Mesh(new THREE.TorusGeometry(0.65, 0.03, 8, 24), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
    innerRing.rotation.x = Math.PI / 2;
    hologramBeam.add(innerRing);

    const beamCone = new THREE.Mesh(
      new THREE.ConeGeometry(1.6, 2.4, 32, 1, true),
      new THREE.MeshBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false })
    );
    beamCone.position.y = -1.2;
    hologramBeam.add(beamCone);

    const hologramLight = new THREE.PointLight(0x06b6d4, 0, 8);
    hologramLight.position.set(0, 3.4, 0);
    scene.add(hologramLight);
    hologramBeam.visible = false;
    scene.add(hologramBeam);

    // 3D AI AGENT MODEL (Robot Avatar)
    const avatarGroup = new THREE.Group();
    avatarGroup.position.set(0, 0.95, 1.05);

    const robotMat = new THREE.MeshStandardMaterial({ color: 0x1e2433, metalness: 0.85, roughness: 0.25 });
    const jointMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.95, roughness: 0.15 });

    // Torso
    const torso = new THREE.Group();
    const chest = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.76, 0.44), robotMat);
    chest.position.y = 0.55;
    chest.castShadow = true;
    torso.add(chest);

    // Arc Reactor Core in Chest
    const reactor = new THREE.Mesh(
      new THREE.CylinderGeometry(0.13, 0.13, 0.06, 24),
      new THREE.MeshBasicMaterial({ color: 0x06b6d4 })
    );
    reactor.rotation.x = Math.PI / 2;
    reactor.position.set(0, 0.65, 0.23);
    torso.add(reactor);

    const reactorLight = new THREE.PointLight(0x06b6d4, 1.6, 3.5);
    reactorLight.position.set(0, 0.65, 0.35);
    torso.add(reactorLight);
    avatarGroup.add(torso);

    // Head
    const head = new THREE.Group();
    head.position.set(0, 1.18, 0);

    const helmet = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.46, 0.48), robotMat);
    helmet.castShadow = true;
    head.add(helmet);

    // Glowing LED Visor
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.16, 0.06), new THREE.MeshBasicMaterial({ color: 0x06b6d4 }));
    visor.position.set(0, 0.04, 0.23);
    head.add(visor);

    // Antenna
    const antennaStem = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.28, 8), jointMat);
    antennaStem.position.set(0.18, 0.34, 0);
    antennaStem.rotation.z = -0.2;
    head.add(antennaStem);

    const antennaLed = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 12), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
    antennaLed.position.set(0.22, 0.48, 0);
    head.add(antennaLed);
    avatarGroup.add(head);

    // Arms & Hands
    const leftArm = new THREE.Group();
    leftArm.position.set(-0.46, 0.88, 0.05);
    leftArm.add(new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 12), jointMat));
    const leftForearm = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.44, 0.13), robotMat);
    leftForearm.position.set(0, -0.26, 0.16);
    leftForearm.rotation.x = 0.85;
    leftForearm.castShadow = true;
    leftArm.add(leftForearm);
    const leftHand = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.06, 0.17), jointMat);
    leftHand.position.set(0, -0.44, 0.42);
    leftArm.add(leftHand);
    avatarGroup.add(leftArm);

    const rightArm = new THREE.Group();
    rightArm.position.set(0.46, 0.88, 0.05);
    rightArm.add(new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 12), jointMat));
    const rightForearm = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.44, 0.13), robotMat);
    rightForearm.position.set(0, -0.26, 0.16);
    rightForearm.rotation.x = 0.85;
    rightForearm.castShadow = true;
    rightArm.add(rightForearm);
    const rightHand = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.06, 0.17), jointMat);
    rightHand.position.set(0, -0.44, 0.42);
    rightArm.add(rightHand);
    avatarGroup.add(rightArm);

    // Legs
    const legLeft = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.65, 0.18), robotMat);
    legLeft.position.set(-0.24, 0.35, 0.3);
    legLeft.rotation.x = 0.7;
    avatarGroup.add(legLeft);

    const legRight = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.65, 0.18), robotMat);
    legRight.position.set(0.24, 0.35, 0.3);
    legRight.rotation.x = 0.7;
    avatarGroup.add(legRight);

    scene.add(avatarGroup);

    // Confetti Particles
    const confettiCount = 90;
    const confettiGeo = new THREE.BufferGeometry();
    const confettiPos = new Float32Array(confettiCount * 3);
    const confettiVelocities: THREE.Vector3[] = [];
    const confettiColors = new Float32Array(confettiCount * 3);
    const palette = [
      new THREE.Color(0x06b6d4),
      new THREE.Color(0xec4899),
      new THREE.Color(0x10b981),
      new THREE.Color(0xfacc15),
      new THREE.Color(0x38bdf8),
    ];
    for (let i = 0; i < confettiCount; i++) {
      confettiPos[i * 3] = 0;
      confettiPos[i * 3 + 1] = -10;
      confettiPos[i * 3 + 2] = 0;
      confettiVelocities.push(
        new THREE.Vector3((Math.random() - 0.5) * 4.5, 3.5 + Math.random() * 4.5, (Math.random() - 0.5) * 4.5)
      );
      const color = palette[i % palette.length];
      confettiColors[i * 3] = color.r;
      confettiColors[i * 3 + 1] = color.g;
      confettiColors[i * 3 + 2] = color.b;
    }
    confettiGeo.setAttribute('position', new THREE.BufferAttribute(confettiPos, 3));
    confettiGeo.setAttribute('color', new THREE.BufferAttribute(confettiColors, 3));
    const confettiMat = new THREE.PointsMaterial({ size: 0.15, vertexColors: true, transparent: true, opacity: 0.9 });
    const confettiParticles = new THREE.Points(confettiGeo, confettiMat);
    scene.add(confettiParticles);

    const clock = new THREE.Clock();

    sceneStateRef.current = {
      scene,
      camera,
      renderer,
      controls,
      centerCanvas,
      centerCtx,
      centerTexture,
      leftCanvas,
      leftCtx,
      leftTexture,
      rightCanvas,
      rightCtx,
      rightTexture,
      serverLeds,
      robotParts: {
        avatarGroup,
        head,
        torso,
        visor,
        reactor,
        reactorLight,
        leftArm,
        rightArm,
        leftHand,
        rightHand,
      },
      hologramBeam,
      hologramLight,
      steamParticles,
      confettiParticles,
      confettiVelocities,
      confettiActive: false,
      confettiTimer: 0,
      clock,
      targetCamPos: initialConfig.pos.clone(),
      targetCamLookAt: initialConfig.target.clone(),
      currentCamLookAt: initialConfig.target.clone(),
      animFrameId: 0,
    };

    const handleResize = () => {
      if (!containerRef.current || !sceneStateRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Animation Render Loop
    const animate = () => {
      const state = sceneStateRef.current;
      if (!state) return;

      const delta = state.clock.getDelta();
      const elapsedTime = state.clock.getElapsedTime();

      // Lerp camera
      state.camera.position.lerp(state.targetCamPos, 0.04);
      state.currentCamLookAt.lerp(state.targetCamLookAt, 0.04);
      state.controls.target.copy(state.currentCamLookAt);
      state.controls.update();

      const currentStatus = useAgentStore.getState().agentStatus;
      const currentTaskData = useAgentStore.getState().activeTask;
      const currentLogs = useAgentStore.getState().monitorLogStream;
      const currentTelemetry = useAgentStore.getState().telemetry;

      // 1. RENDER CENTER MONITOR (Terminal & Active Code)
      const cCtx = state.centerCtx;
      const cw = state.centerCanvas.width;
      const ch = state.centerCanvas.height;
      cCtx.fillStyle = '#050914';
      cCtx.fillRect(0, 0, cw, ch);

      // Terminal Header
      cCtx.fillStyle = '#06b6d4';
      cCtx.font = 'bold 24px monospace';
      cCtx.fillText(`// CYBER-OPERATOR CLI -- [${currentStatus}]`, 30, 48);

      if (currentTaskData) {
        cCtx.fillStyle = '#f8fafc';
        cCtx.font = 'bold 20px monospace';
        cCtx.fillText(`TASK: ${currentTaskData.title.slice(0, 44)}`, 30, 88);

        // Progress Bar
        const barWidth = 600;
        const progWidth = (currentTaskData.progress / 100) * barWidth;
        cCtx.fillStyle = '#1e293b';
        cCtx.fillRect(30, 110, barWidth, 16);
        cCtx.fillStyle = currentStatus === 'PROCESSING' ? '#06b6d4' : '#10b981';
        cCtx.fillRect(30, 110, progWidth, 16);

        cCtx.fillStyle = '#38bdf8';
        cCtx.font = '16px monospace';
        cCtx.fillText(`${currentTaskData.progress}% -- ${currentTaskData.currentStep.slice(0, 48)}`, 30, 155);
      } else {
        cCtx.fillStyle = '#64748b';
        cCtx.font = '18px monospace';
        cCtx.fillText('System Standby. Ready for developer task delegation.', 30, 88);
      }

      // Code Stream Lines
      cCtx.font = '17px monospace';
      currentLogs.forEach((line, idx) => {
        cCtx.fillStyle = idx === 0 ? '#38bdf8' : '#cbd5e1';
        cCtx.fillText(line, 30, 205 + idx * 34);
      });

      // Flashing Cursor
      if (Math.floor(elapsedTime * 2.5) % 2 === 0) {
        cCtx.fillStyle = '#06b6d4';
        cCtx.fillRect(30, 205 + currentLogs.length * 34 - 16, 14, 20);
      }

      // Center Scanlines
      cCtx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      for (let y = 0; y < ch; y += 4) {
        cCtx.fillRect(0, y, cw, 2);
      }
      state.centerTexture.needsUpdate = true;

      // 2. RENDER LEFT MONITOR (System Telemetry & Neural Graph)
      const lCtx = state.leftCtx;
      const lw = state.leftCanvas.width;
      const lh = state.leftCanvas.height;
      lCtx.fillStyle = '#050914';
      lCtx.fillRect(0, 0, lw, lh);

      lCtx.fillStyle = '#06b6d4';
      lCtx.font = 'bold 24px monospace';
      lCtx.fillText('SYS.TELEMETRY', 25, 48);

      lCtx.fillStyle = '#94a3b8';
      lCtx.font = '18px monospace';
      lCtx.fillText(`CPU:  ${currentStatus === 'PROCESSING' ? 82 + Math.floor(Math.sin(elapsedTime * 6) * 10) : currentTelemetry.cpuUsage}%`, 25, 95);
      lCtx.fillText(`MEM:  ${currentStatus === 'PROCESSING' ? 6.4 : 2.8} GB`, 25, 135);
      lCtx.fillText(`SYNC: 99.4%`, 25, 175);
      lCtx.fillText(`NODE: 10.14.0.8`, 25, 215);

      // Neural Activity Waveform
      lCtx.fillStyle = '#38bdf8';
      lCtx.font = 'bold 16px monospace';
      lCtx.fillText('NEURAL SYNC FREQUENCY', 25, 275);

      lCtx.beginPath();
      lCtx.strokeStyle = currentStatus === 'PROCESSING' ? '#ec4899' : '#06b6d4';
      lCtx.lineWidth = 3;
      for (let x = 0; x < lw - 50; x += 4) {
        const speed = currentStatus === 'PROCESSING' ? 14 : 4;
        const amp = currentStatus === 'PROCESSING' ? 42 : 18;
        const y = 370 + Math.sin((x * 0.08) + (elapsedTime * speed)) * amp;
        if (x === 0) lCtx.moveTo(25 + x, y);
        else lCtx.lineTo(25 + x, y);
      }
      lCtx.stroke();

      lCtx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      for (let y = 0; y < lh; y += 4) {
        lCtx.fillRect(0, y, lw, 2);
      }
      state.leftTexture.needsUpdate = true;

      // 3. RENDER RIGHT MONITOR (CI/CD Pipeline & Tests)
      const rCtx = state.rightCtx;
      const rw = state.rightCanvas.width;
      const rh = state.rightCanvas.height;
      rCtx.fillStyle = '#050914';
      rCtx.fillRect(0, 0, rw, rh);

      rCtx.fillStyle = '#10b981';
      rCtx.font = 'bold 24px monospace';
      rCtx.fillText('CI/CD PIPELINE', 25, 48);

      rCtx.fillStyle = '#e2e8f0';
      rCtx.font = '18px monospace';
      rCtx.fillText('BRANCH: main [0f8b1c]', 25, 95);
      rCtx.fillText('BUILD:  SUCCESS (0 errors)', 25, 135);
      rCtx.fillText('TESTS:  76/76 PASSED (100%)', 25, 175);
      rCtx.fillText('AUDIT:  0 CVEs DETECTED', 25, 215);

      // Animated Git Graph nodes
      rCtx.fillStyle = '#38bdf8';
      rCtx.font = 'bold 16px monospace';
      rCtx.fillText('ACTIVE COMMITS', 25, 275);

      const commitColors = ['#06b6d4', '#10b981', '#ec4899'];
      for (let c = 0; c < 3; c++) {
        rCtx.fillStyle = commitColors[c];
        rCtx.beginPath();
        rCtx.arc(45, 330 + c * 48, 8, 0, Math.PI * 2);
        rCtx.fill();

        rCtx.fillStyle = '#94a3b8';
        rCtx.font = '16px monospace';
        rCtx.fillText(`c${c + 1} // feat: pipeline step ${c + 1}`, 70, 336 + c * 48);
      }

      rCtx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      for (let y = 0; y < rh; y += 4) {
        rCtx.fillRect(0, y, rw, 2);
      }
      state.rightTexture.needsUpdate = true;

      // 4. SERVER RACK LEDS ANIMATION
      const ledSpeed = currentStatus === 'PROCESSING' ? 8 : 2;
      state.serverLeds.forEach((led, idx) => {
        const mat = led.material as THREE.MeshBasicMaterial;
        const blink = Math.sin(elapsedTime * ledSpeed + idx * 1.5) > 0.1;
        mat.color.setHex(blink ? 0x06b6d4 : 0x0f172a);
      });

      // 5. STEAM PARTICLES ANIMATION
      const posAttr = state.steamParticles.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < posAttr.count; i++) {
        let y = posAttr.getY(i) + delta * 0.15;
        if (y > 2.2) y = 1.6;
        posAttr.setY(i, y);
      }
      posAttr.needsUpdate = true;

      // 6. ROBOT AVATAR ANIMATION STATE MACHINE
      const { head, torso, visor, reactor, reactorLight, leftArm, rightArm } = state.robotParts;

      if (currentStatus === 'PROCESSING') {
        // Fast typing
        const typingSpeed = 26;
        leftArm.rotation.x = 0.15 + Math.sin(elapsedTime * typingSpeed) * 0.18;
        rightArm.rotation.x = 0.15 + Math.cos(elapsedTime * typingSpeed) * 0.18;

        head.rotation.y = Math.sin(elapsedTime * 1.2) * 0.08;
        head.rotation.x = 0.1;

        const pulse = 0.5 + 0.5 * Math.sin(elapsedTime * 10);
        (visor.material as THREE.MeshBasicMaterial).color.setHex(pulse > 0.5 ? 0x06b6d4 : 0x38bdf8);
        (reactor.material as THREE.MeshBasicMaterial).color.setHex(0x06b6d4);
        reactorLight.intensity = 2.5 + pulse * 2.0;

        state.hologramBeam.visible = true;
        state.hologramBeam.rotation.y += delta * 1.8;
        state.hologramLight.intensity = 2.2 + pulse;
      } else if (currentStatus === 'COMPLETED') {
        leftArm.rotation.x = -1.2;
        rightArm.rotation.x = -1.2;
        head.rotation.x = -0.15 + Math.sin(elapsedTime * 4) * 0.1;
        head.rotation.y = 0;

        (visor.material as THREE.MeshBasicMaterial).color.setHex(0x10b981);
        (reactor.material as THREE.MeshBasicMaterial).color.setHex(0x10b981);
        reactorLight.color.setHex(0x10b981);
        reactorLight.intensity = 3.5;

        state.hologramBeam.visible = false;
        state.hologramLight.intensity = 0;

        if (!state.confettiActive) {
          state.confettiActive = true;
          state.confettiTimer = 0;
          const confPos = state.confettiParticles.geometry.attributes.position as THREE.BufferAttribute;
          for (let i = 0; i < confPos.count; i++) {
            confPos.setXYZ(i, 0, 1.8, 1.05);
            state.confettiVelocities[i].set(
              (Math.random() - 0.5) * 5.0,
              4.0 + Math.random() * 4.0,
              (Math.random() - 0.5) * 5.0
            );
          }
          confPos.needsUpdate = true;
        }
      } else if (currentStatus === 'ERROR') {
        leftArm.rotation.x = 0.5;
        rightArm.rotation.x = 0.5;
        head.rotation.y = Math.sin(elapsedTime * 8) * 0.35;
        head.rotation.x = 0.25;

        const redPulse = Math.sin(elapsedTime * 12) > 0 ? 0xef4444 : 0x7f1d1d;
        (visor.material as THREE.MeshBasicMaterial).color.setHex(redPulse);
        (reactor.material as THREE.MeshBasicMaterial).color.setHex(redPulse);
        reactorLight.color.setHex(0xef4444);
        reactorLight.intensity = 2.8;

        state.hologramBeam.visible = false;
        state.hologramLight.intensity = 0;
      } else {
        // IDLE
        state.confettiActive = false;
        torso.position.y = Math.sin(elapsedTime * 1.8) * 0.02;
        head.position.y = 1.18 + Math.sin(elapsedTime * 1.8) * 0.02;

        head.rotation.y = Math.sin(elapsedTime * 0.6) * 0.28;
        head.rotation.x = 0.05;

        leftArm.rotation.x = 0.05 + Math.sin(elapsedTime * 0.8) * 0.03;
        rightArm.rotation.x = 0.05 + Math.cos(elapsedTime * 0.8) * 0.03;

        (visor.material as THREE.MeshBasicMaterial).color.setHex(0x06b6d4);
        (reactor.material as THREE.MeshBasicMaterial).color.setHex(0x06b6d4);
        reactorLight.color.setHex(0x06b6d4);
        reactorLight.intensity = 1.2;

        state.hologramBeam.visible = false;
        state.hologramLight.intensity = 0;
      }

      // 7. CONFETTI UPDATE
      if (state.confettiActive) {
        state.confettiTimer += delta;
        const confPos = state.confettiParticles.geometry.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < confPos.count; i++) {
          const vel = state.confettiVelocities[i];
          vel.y -= 9.8 * delta;

          let x = confPos.getX(i) + vel.x * delta;
          let y = confPos.getY(i) + vel.y * delta;
          let z = confPos.getZ(i) + vel.z * delta;

          if (y < 0.1) {
            y = 0.1;
            vel.x *= 0.5;
            vel.z *= 0.5;
          }

          confPos.setXYZ(i, x, y, z);
        }
        confPos.needsUpdate = true;
      }

      state.renderer.render(state.scene, state.camera);
      state.animFrameId = requestAnimationFrame(animate);
    };

    sceneStateRef.current.animFrameId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (sceneStateRef.current) {
        cancelAnimationFrame(sceneStateRef.current.animFrameId);
        sceneStateRef.current.renderer.dispose();
      }
    };
  }, []);

  useEffect(() => {
    if (!sceneStateRef.current) return;
    const targetConfig = cameraPresetsConfig[cameraPreset];
    if (targetConfig) {
      sceneStateRef.current.targetCamPos.copy(targetConfig.pos);
      sceneStateRef.current.targetCamLookAt.copy(targetConfig.target);
      setActiveCamName(cameraPreset);
    }
  }, [cameraPreset]);

  const handleCanvasInteraction = () => {
    initAudio();
    if (showControlsHint) {
      setShowControlsHint(false);
    }
  };

  return (
    <div
      ref={containerRef}
      onClick={handleCanvasInteraction}
      onMouseDown={handleCanvasInteraction}
      className="relative w-full h-full overflow-hidden select-none cursor-grab active:cursor-grabbing bg-[#05070f]"
    >
      <canvas ref={canvasRef} className="w-full h-full block outline-none" />

      {/* Floating 3D Camera Angles Toolbar */}
      <div className="absolute top-20 right-6 z-20 flex flex-col gap-2 p-1.5 rounded-2xl border border-slate-800/80 bg-slate-950/80 backdrop-blur-xl shadow-2xl">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setCameraPreset('ISOMETRIC');
          }}
          title="Isometric View (35°)"
          className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl transition-all ${
            activeCamName === 'ISOMETRIC'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-lg shadow-cyan-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
          }`}
        >
          <Camera className="w-3.5 h-3.5" />
          <span>Isometric</span>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setCameraPreset('DESK');
          }}
          title="Battle Station Close-up"
          className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl transition-all ${
            activeCamName === 'DESK'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-lg shadow-cyan-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Battle Station</span>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setCameraPreset('SERVER');
          }}
          title="Server Rack View"
          className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl transition-all ${
            activeCamName === 'SERVER'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-lg shadow-cyan-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
          }`}
        >
          <Server className="w-3.5 h-3.5" />
          <span>Server Rack</span>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setCameraPreset('TOP');
          }}
          title="Top-Down Blueprint"
          className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl transition-all ${
            activeCamName === 'TOP'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-lg shadow-cyan-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Top Down</span>
        </button>
      </div>

      {/* Orbit Controls Hint Badge */}
      {showControlsHint && (
        <div className="absolute bottom-28 left-6 z-20 flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-800/80 bg-slate-950/70 backdrop-blur-md text-xs text-slate-400 animate-fadeIn pointer-events-none">
          <RotateCcw className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
          <span>Drag to orbit • Right-click to pan • Scroll to zoom</span>
        </div>
      )}
    </div>
  );
};
