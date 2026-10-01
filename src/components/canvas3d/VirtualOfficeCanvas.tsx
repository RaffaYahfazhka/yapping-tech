import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { useAgentStore } from '../../store/useAgentStore';
import type { CameraPreset } from '../../types/agent';
import { soundEngine } from '../../services/audioEngine';
import { Camera, Eye, Layers, RotateCcw, Server, Sparkles } from 'lucide-react';

export const VirtualOfficeCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Zustand Store selectors
  const cameraPreset = useAgentStore((state) => state.cameraPreset);
  const setCameraPreset = useAgentStore((state) => state.setCameraPreset);
  const initAudio = useAgentStore((state) => state.initAudio);
  const setActiveDrawer = useAgentStore((state) => state.setActiveDrawer);
  const triggerRobotInteraction = useAgentStore((state) => state.triggerRobotInteraction);

  // Camera targets for smooth interpolation
  const cameraPresetsConfig: Record<CameraPreset, { pos: THREE.Vector3; target: THREE.Vector3 }> = {
    ISOMETRIC: {
      pos: new THREE.Vector3(9.2, 7.5, 9.2),
      target: new THREE.Vector3(0, 1.4, 0),
    },
    DESK: {
      pos: new THREE.Vector3(2.5, 2.3, 3.1),
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
  const [hoveredObjectInfo, setHoveredObjectInfo] = useState<string | null>(null);

  const sceneStateRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;
    raycaster: THREE.Raycaster;
    mouse: THREE.Vector2;
    // Interactive Raycast Targets
    interactiveMeshes: { mesh: THREE.Object3D; name: string; action: () => void }[];
    // Canvases
    centerCanvas: HTMLCanvasElement;
    centerCtx: CanvasRenderingContext2D;
    centerTexture: THREE.CanvasTexture;
    leftCanvas: HTMLCanvasElement;
    leftCtx: CanvasRenderingContext2D;
    leftTexture: THREE.CanvasTexture;
    rightCanvas: HTMLCanvasElement;
    rightCtx: CanvasRenderingContext2D;
    rightTexture: THREE.CanvasTexture;
    // Dynamic Assets
    serverLeds: THREE.Mesh[];
    serverFans: THREE.Group[];
    droneGroup: THREE.Group;
    hovercars: { group: THREE.Group; speed: number; startX: number; endX: number; y: number; z: number }[];
    robotParts: {
      avatarGroup: THREE.Group;
      head: THREE.Group;
      torso: THREE.Group;
      visor: THREE.Mesh;
      reactor: THREE.Mesh;
      reactorLight: THREE.PointLight;
      leftArm: THREE.Group;
      rightArm: THREE.Group;
    };
    hologramBeam: THREE.Group;
    hologramCore: THREE.Mesh;
    hologramLight: THREE.PointLight;
    hologramParticles: THREE.Points;
    steamParticles: THREE.Points;
    ambientDust: THREE.Points;
    confettiParticles: THREE.Points;
    confettiVelocities: THREE.Vector3[];
    confettiActive: boolean;
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
    scene.background = new THREE.Color(0x04060d);
    scene.fog = new THREE.FogExp2(0x04060d, 0.022);

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
    renderer.toneMappingExposure = 1.35;

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.copy(initialConfig.target);
    controls.maxPolarAngle = Math.PI / 2.05;
    controls.minDistance = 3.0;
    controls.maxDistance = 22;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-999, -999);
    const interactiveMeshes: { mesh: THREE.Object3D; name: string; action: () => void }[] = [];

    // 5. Dynamic 2D Canvases
    const centerCanvas = document.createElement('canvas');
    centerCanvas.width = 1024;
    centerCanvas.height = 512;
    const centerCtx = centerCanvas.getContext('2d')!;
    const centerTexture = new THREE.CanvasTexture(centerCanvas);

    const leftCanvas = document.createElement('canvas');
    leftCanvas.width = 512;
    leftCanvas.height = 512;
    const leftCtx = leftCanvas.getContext('2d')!;
    const leftTexture = new THREE.CanvasTexture(leftCanvas);

    const rightCanvas = document.createElement('canvas');
    rightCanvas.width = 512;
    rightCanvas.height = 512;
    const rightCtx = rightCanvas.getContext('2d')!;
    const rightTexture = new THREE.CanvasTexture(rightCanvas);

    // 6. Lights
    const ambientLight = new THREE.AmbientLight(0x13152c, 1.5);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xe0f2fe, 2.2);
    dirLight.position.set(7, 13, 7);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.bias = -0.0004;
    scene.add(dirLight);

    const cyanRim = new THREE.PointLight(0x06b6d4, 3.8, 18);
    cyanRim.position.set(-6, 4.5, 4.5);
    scene.add(cyanRim);

    const magentaRim = new THREE.PointLight(0xec4899, 3.4, 18);
    magentaRim.position.set(6, 4.2, -4.5);
    scene.add(magentaRim);

    const deskLampLight = new THREE.SpotLight(0xfff3d6, 3.5, 7, 0.65, 0.4);
    deskLampLight.position.set(1.7, 2.5, 0.35);
    deskLampLight.target.position.set(-0.15, 1.44, 0.35);
    deskLampLight.castShadow = true;
    scene.add(deskLampLight);
    scene.add(deskLampLight.target);

    // 7. ENVIRONMENT ASSETS
    const floorGeo = new THREE.BoxGeometry(16, 0.4, 16);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x070a14, roughness: 0.35, metalness: 0.8 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = -0.2;
    floor.receiveShadow = true;
    scene.add(floor);

    const gridHelper = new THREE.GridHelper(16, 32, 0x06b6d4, 0x172554);
    gridHelper.position.y = 0.01;
    (gridHelper.material as THREE.Material).transparent = true;
    (gridHelper.material as THREE.Material).opacity = 0.35;
    scene.add(gridHelper);

    // Workstation Floor Rug Plate
    const rug = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.02, 4.2), new THREE.MeshStandardMaterial({ color: 0x0c111e, roughness: 0.6, metalness: 0.5 }));
    rug.position.set(0, 0.01, 0.6);
    rug.receiveShadow = true;
    scene.add(rug);

    const rugEdge = new THREE.Mesh(new THREE.BoxGeometry(5.68, 0.03, 4.28), new THREE.MeshBasicMaterial({ color: 0x06b6d4 }));
    rugEdge.position.set(0, 0.005, 0.6);
    scene.add(rugEdge);

    // Walls
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x070b16, roughness: 0.85, metalness: 0.2 });
    const backWallLeft = new THREE.Mesh(new THREE.BoxGeometry(0.4, 7, 16), wallMat);
    backWallLeft.position.set(-8, 3.5, 0);
    backWallLeft.receiveShadow = true;
    scene.add(backWallLeft);

    const backWallRear = new THREE.Mesh(new THREE.BoxGeometry(16, 7, 0.4), wallMat);
    backWallRear.position.set(0, 3.5, -8);
    backWallRear.receiveShadow = true;
    scene.add(backWallRear);

    // Neon Wall Strips
    const neonMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
    const strip1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 6.2, 0.06), neonMat);
    strip1.position.set(-7.75, 3.5, -3);
    const strip2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 6.2, 0.06), neonMat);
    strip2.position.set(-7.75, 3.5, 3);
    scene.add(strip1, strip2);

    // Neon Sign: "JIRA SPRINT 34 // CYBER-OPERATOR"
    const signGroup = new THREE.Group();
    const signBack = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.85, 0.05), new THREE.MeshStandardMaterial({ color: 0x060914, metalness: 0.9 }));
    signBack.position.set(-2, 5.6, -7.75);
    signGroup.add(signBack);

    const signTrim = new THREE.Mesh(new THREE.BoxGeometry(5.3, 0.92, 0.03), new THREE.MeshBasicMaterial({ color: 0xec4899 }));
    signTrim.position.set(-2, 5.6, -7.77);
    signGroup.add(signTrim);
    scene.add(signGroup);

    // Skyline Window & Animated Flying Hovercars
    const winFrameMat = new THREE.MeshStandardMaterial({ color: 0x0f1524, metalness: 0.9, roughness: 0.2 });
    const windowFrame = new THREE.Mesh(new THREE.BoxGeometry(6.8, 4.4, 0.2), winFrameMat);
    windowFrame.position.set(3.4, 3.6, -7.8);
    scene.add(windowFrame);

    const winGlass = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 4.0), new THREE.MeshBasicMaterial({ color: 0x03050c }));
    winGlass.position.set(3.4, 3.6, -7.68);
    scene.add(winGlass);

    // City Skyscrapers
    const buildingMat = new THREE.MeshBasicMaterial({ color: 0x070c18 });
    const skylineGroup = new THREE.Group();
    const heights = [3.2, 4.2, 2.5, 4.7, 3.4, 5.0, 2.8];
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

    // Flying Hovercars
    const hovercars: { group: THREE.Group; speed: number; startX: number; endX: number; y: number; z: number }[] = [];
    const carConfigs = [
      { y: 3.2, speed: 1.8, color: 0x06b6d4 },
      { y: 4.5, speed: -2.4, color: 0xef4444 },
      { y: 2.3, speed: 1.4, color: 0x38bdf8 },
    ];
    carConfigs.forEach((cfg, idx) => {
      const hg = new THREE.Group();
      const carBody = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.06, 0.08), new THREE.MeshBasicMaterial({ color: cfg.color }));
      hg.add(carBody);
      // Light trail
      const trail = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.02, 0.02), new THREE.MeshBasicMaterial({ color: cfg.color, transparent: true, opacity: 0.8 }));
      trail.position.x = cfg.speed > 0 ? -0.2 : 0.2;
      hg.add(trail);

      hg.position.set(0.5 + idx * 2, cfg.y, -7.58);
      scene.add(hg);
      hovercars.push({ group: hg, speed: cfg.speed, startX: 0.2, endX: 6.6, y: cfg.y, z: -7.58 });
    });

    // Central Desk Setup
    const deskGroup = new THREE.Group();
    const deskTopGeo = new THREE.BoxGeometry(4.4, 0.12, 2.3);
    const deskTopMat = new THREE.MeshStandardMaterial({ color: 0x131724, metalness: 0.7, roughness: 0.25 });
    const deskTop = new THREE.Mesh(deskTopGeo, deskTopMat);
    deskTop.position.set(0, 1.35, 0);
    deskTop.castShadow = true;
    deskTop.receiveShadow = true;
    deskGroup.add(deskTop);

    const deskGlow = new THREE.Mesh(new THREE.BoxGeometry(4.44, 0.02, 2.34), new THREE.MeshBasicMaterial({ color: 0x06b6d4 }));
    deskGlow.position.set(0, 1.28, 0);
    deskGroup.add(deskGlow);

    const legMat = new THREE.MeshStandardMaterial({ color: 0x090c15, metalness: 0.95, roughness: 0.2 });
    const legGeo = new THREE.BoxGeometry(0.14, 1.35, 1.9);
    const leftLeg = new THREE.Mesh(legGeo, legMat);
    leftLeg.position.set(-1.95, 0.675, 0);
    leftLeg.castShadow = true;
    const rightLeg = new THREE.Mesh(legGeo, legMat);
    rightLeg.position.set(1.95, 0.675, 0);
    rightLeg.castShadow = true;
    deskGroup.add(leftLeg, rightLeg);

    const mouseMat = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.015, 1.4), new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.9 }));
    mouseMat.position.set(0, 1.42, 0.15);
    deskGroup.add(mouseMat);

    const keyboard = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.04, 0.48), new THREE.MeshStandardMaterial({ color: 0x1b202e, metalness: 0.5, roughness: 0.4 }));
    keyboard.position.set(-0.15, 1.44, 0.35);
    keyboard.castShadow = true;
    deskGroup.add(keyboard);

    const keyGlow = new THREE.Mesh(new THREE.BoxGeometry(1.16, 0.01, 0.4), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
    keyGlow.position.set(-0.15, 1.465, 0.35);
    deskGroup.add(keyGlow);

    const mouseMesh = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.05, 0.28), new THREE.MeshStandardMaterial({ color: 0x1c2538, metalness: 0.8 }));
    mouseMesh.position.set(0.8, 1.44, 0.35);
    deskGroup.add(mouseMesh);

    // Coffee Mug with Steam
    const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.25, 16), new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3 }));
    mug.position.set(1.45, 1.53, 0.4);
    mug.castShadow = true;
    deskGroup.add(mug);

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

    // Desk Lamp
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

    // TRIPLE MONITORS
    const monitorMount = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.85, 12), legMat);
    monitorMount.position.set(0, 1.78, -0.75);
    deskGroup.add(monitorMount);

    const bezelMat = new THREE.MeshStandardMaterial({ color: 0x080b12, metalness: 0.85, roughness: 0.3 });

    // Center Monitor
    const centerBezel = new THREE.Mesh(new THREE.BoxGeometry(2.35, 1.18, 0.06), bezelMat);
    centerBezel.position.set(0, 2.2, -0.65);
    deskGroup.add(centerBezel);

    const centerScreen = new THREE.Mesh(new THREE.PlaneGeometry(2.26, 1.08), new THREE.MeshBasicMaterial({ map: centerTexture }));
    centerScreen.position.set(0, 2.2, -0.615);
    deskGroup.add(centerScreen);

    // Left Monitor
    const leftMonitor = new THREE.Group();
    leftMonitor.add(new THREE.Mesh(new THREE.BoxGeometry(1.22, 1.04, 0.05), bezelMat));
    const leftScreen = new THREE.Mesh(new THREE.PlaneGeometry(1.16, 0.98), new THREE.MeshBasicMaterial({ map: leftTexture }));
    leftScreen.position.z = 0.03;
    leftMonitor.add(leftScreen);
    leftMonitor.position.set(-1.7, 2.2, -0.38);
    leftMonitor.rotation.y = 0.42;
    deskGroup.add(leftMonitor);

    // Right Monitor
    const rightMonitor = new THREE.Group();
    rightMonitor.add(new THREE.Mesh(new THREE.BoxGeometry(1.22, 1.04, 0.05), bezelMat));
    const rightScreen = new THREE.Mesh(new THREE.PlaneGeometry(1.16, 0.98), new THREE.MeshBasicMaterial({ map: rightTexture }));
    rightScreen.position.z = 0.03;
    rightMonitor.add(rightScreen);
    rightMonitor.position.set(1.7, 2.2, -0.38);
    rightMonitor.rotation.y = -0.42;
    deskGroup.add(rightMonitor);

    scene.add(deskGroup);

    // Register monitors as interactive click target
    interactiveMeshes.push({
      mesh: centerScreen,
      name: 'Battle Station Monitors',
      action: () => {
        soundEngine.playClick();
        setCameraPreset('DESK');
      },
    });

    // Sleek Ergonomic Cyber Chair
    const chairGroup = new THREE.Group();
    const chairMat = new THREE.MeshStandardMaterial({ color: 0x0f1320, roughness: 0.4, metalness: 0.6 });
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

    // Server Rack Cabinet with Spinning Fans & LEDs
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

    // Spinning Cooling Fans inside Server Rack
    const serverFans: THREE.Group[] = [];
    [-2.2, -4.2].forEach((zPos) => {
      const fanGroup = new THREE.Group();
      fanGroup.position.set(-4.8, 4.4, zPos);
      fanGroup.rotation.y = Math.PI / 2;

      for (let f = 0; f < 4; f++) {
        const blade = new THREE.Mesh(
          new THREE.BoxGeometry(0.24, 0.04, 0.02),
          new THREE.MeshBasicMaterial({ color: 0x06b6d4 })
        );
        blade.rotation.z = (f * Math.PI) / 2;
        fanGroup.add(blade);
      }
      serverGroup.add(fanGroup);
      serverFans.push(fanGroup);
    });

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

    // Register Server Rack as interactive click target
    interactiveMeshes.push({
      mesh: serverRack,
      name: 'Server Rack Cluster',
      action: () => {
        soundEngine.playClick();
        setCameraPreset('SERVER');
      },
    });

    // Whiteboard / Jira Board on Left Wall
    const kanbanGroup = new THREE.Group();
    const board = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 2.6, 4.2),
      new THREE.MeshStandardMaterial({ color: 0x0e1424, roughness: 0.2, metalness: 0.4 })
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

    // Register Whiteboard as interactive click target to open Jira Board!
    interactiveMeshes.push({
      mesh: board,
      name: 'Jira Sprint Board',
      action: () => {
        soundEngine.playClick();
        setActiveDrawer('JIRA');
      },
    });

    // Bioluminescent Terrarium Plant
    const plantGroup = new THREE.Group();
    const pot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.25, 0.65, 6),
      new THREE.MeshStandardMaterial({ color: 0x1b2333, metalness: 0.3, roughness: 0.8 })
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

    // 8. FLOATING COMPANION DRONE ("Byte-01")
    const droneGroup = new THREE.Group();
    const droneSphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.2 })
    );
    droneGroup.add(droneSphere);

    // Glowing Drone Visor / Scanner Eye
    const droneEye = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), new THREE.MeshBasicMaterial({ color: 0x06b6d4 }));
    droneEye.position.set(0, 0, 0.12);
    droneGroup.add(droneEye);

    // Antigravity Thruster Ring
    const thruster = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.02, 8, 16), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
    thruster.rotation.x = Math.PI / 2;
    thruster.position.y = -0.12;
    droneGroup.add(thruster);

    // Antigravity Thruster Point Light
    const thrusterLight = new THREE.PointLight(0x06b6d4, 1.2, 2.5);
    thrusterLight.position.y = -0.15;
    droneGroup.add(thrusterLight);

    droneGroup.position.set(1.6, 2.8, 1.2);
    scene.add(droneGroup);

    // Register Drone as interactive click target
    interactiveMeshes.push({
      mesh: droneSphere,
      name: 'Cyber Drone Byte-01',
      action: () => {
        soundEngine.playSuccessChime();
      },
    });

    // 9. ANIMATED HOLOGRAPHIC NEURAL MATRIX CORE
    const hologramBeam = new THREE.Group();
    hologramBeam.position.set(0, 3.8, 0);

    const emitterRing = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.04, 8, 32), new THREE.MeshBasicMaterial({ color: 0x06b6d4 }));
    emitterRing.rotation.x = Math.PI / 2;
    hologramBeam.add(emitterRing);

    const innerRing = new THREE.Mesh(new THREE.TorusGeometry(0.68, 0.03, 8, 24), new THREE.MeshBasicMaterial({ color: 0xec4899 }));
    innerRing.rotation.x = Math.PI / 2;
    hologramBeam.add(innerRing);

    // 3D Spinning Holographic Wireframe Core
    const hologramCore = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.42, 1),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true, transparent: true, opacity: 0.85 })
    );
    hologramCore.position.y = -1.1;
    hologramBeam.add(hologramCore);

    const beamCone = new THREE.Mesh(
      new THREE.ConeGeometry(1.65, 2.4, 32, 1, true),
      new THREE.MeshBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.2, side: THREE.DoubleSide, depthWrite: false })
    );
    beamCone.position.y = -1.2;
    hologramBeam.add(beamCone);

    // Hologram Floating Data Particles
    const holoParticleCount = 45;
    const holoGeo = new THREE.BufferGeometry();
    const holoPos = new Float32Array(holoParticleCount * 3);
    for (let i = 0; i < holoParticleCount; i++) {
      holoPos[i * 3] = (Math.random() - 0.5) * 1.2;
      holoPos[i * 3 + 1] = -2.2 + Math.random() * 2.0;
      holoPos[i * 3 + 2] = (Math.random() - 0.5) * 1.2;
    }
    holoGeo.setAttribute('position', new THREE.BufferAttribute(holoPos, 3));
    const hologramParticles = new THREE.Points(holoGeo, new THREE.PointsMaterial({ color: 0x38bdf8, size: 0.07, transparent: true, opacity: 0.8 }));
    hologramBeam.add(hologramParticles);

    const hologramLight = new THREE.PointLight(0x06b6d4, 0, 8);
    hologramLight.position.set(0, 3.4, 0);
    scene.add(hologramLight);
    hologramBeam.visible = false;
    scene.add(hologramBeam);

    // 10. 3D AI AGENT MODEL (Robot Avatar)
    const avatarGroup = new THREE.Group();
    avatarGroup.position.set(0, 0.95, 1.05);

    const robotMat = new THREE.MeshStandardMaterial({ color: 0x1c2233, metalness: 0.88, roughness: 0.22 });
    const jointMat = new THREE.MeshStandardMaterial({ color: 0x0d1220, metalness: 0.95, roughness: 0.15 });

    // Torso
    const torso = new THREE.Group();
    const chest = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.76, 0.44), robotMat);
    chest.position.y = 0.55;
    chest.castShadow = true;
    torso.add(chest);

    // Arc Reactor Core in Chest
    const reactor = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.06, 24), new THREE.MeshBasicMaterial({ color: 0x06b6d4 }));
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

    // Register Robot Avatar as interactive click target!
    interactiveMeshes.push({
      mesh: helmet,
      name: 'Cyber-Operator AI Avatar',
      action: () => {
        triggerRobotInteraction();
      },
    });

    // 11. AMBIENT ROOM DATA PARTICLES
    const dustCount = 65;
    const dustGeo = new THREE.BufferGeometry();
    const dustPos = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      dustPos[i * 3] = (Math.random() - 0.5) * 14;
      dustPos[i * 3 + 1] = 0.5 + Math.random() * 5.5;
      dustPos[i * 3 + 2] = (Math.random() - 0.5) * 14;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    const ambientDust = new THREE.Points(
      dustGeo,
      new THREE.PointsMaterial({ color: 0x06b6d4, size: 0.05, transparent: true, opacity: 0.5 })
    );
    scene.add(ambientDust);

    // 12. 3D CELEBRATION CONFETTI
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
      raycaster,
      mouse,
      interactiveMeshes,
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
      serverFans,
      droneGroup,
      hovercars,
      robotParts: {
        avatarGroup,
        head,
        torso,
        visor,
        reactor,
        reactorLight,
        leftArm,
        rightArm,
      },
      hologramBeam,
      hologramCore,
      hologramLight,
      hologramParticles,
      steamParticles,
      ambientDust,
      confettiParticles,
      confettiVelocities,
      confettiActive: false,
      clock,
      targetCamPos: initialConfig.pos.clone(),
      targetCamLookAt: initialConfig.target.clone(),
      currentCamLookAt: initialConfig.target.clone(),
      animFrameId: 0,
    };

    // Mouse Move & Raycast Pointer Tracking
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current || !sceneStateRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      sceneStateRef.current.mouse.set(x, y);

      sceneStateRef.current.raycaster.setFromCamera(sceneStateRef.current.mouse, sceneStateRef.current.camera);
      const meshesToTest = sceneStateRef.current.interactiveMeshes.map((m) => m.mesh);
      const intersects = sceneStateRef.current.raycaster.intersectObjects(meshesToTest, true);

      if (intersects.length > 0) {
        const hit = sceneStateRef.current.interactiveMeshes.find(
          (im) => im.mesh === intersects[0].object || im.mesh.children.includes(intersects[0].object)
        );
        if (hit) {
          setHoveredObjectInfo(hit.name);
          if (containerRef.current) containerRef.current.style.cursor = 'pointer';
        }
      } else {
        setHoveredObjectInfo(null);
        if (containerRef.current) containerRef.current.style.cursor = 'grab';
      }
    };

    // Click Raycast Execution
    const handleClick = () => {
      initAudio();
      if (!sceneStateRef.current) return;
      sceneStateRef.current.raycaster.setFromCamera(sceneStateRef.current.mouse, sceneStateRef.current.camera);
      const meshesToTest = sceneStateRef.current.interactiveMeshes.map((m) => m.mesh);
      const intersects = sceneStateRef.current.raycaster.intersectObjects(meshesToTest, true);

      if (intersects.length > 0) {
        const hit = sceneStateRef.current.interactiveMeshes.find(
          (im) => im.mesh === intersects[0].object || im.mesh.children.includes(intersects[0].object)
        );
        if (hit) {
          hit.action();
        }
      }
    };

    const containerEl = containerRef.current;
    containerEl.addEventListener('mousemove', handleMouseMove);
    containerEl.addEventListener('click', handleClick);

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
      const robotEmotion = useAgentStore.getState().robotEmotion;
      const currentTaskData = useAgentStore.getState().activeTask;
      const currentLogs = useAgentStore.getState().monitorLogStream;
      const currentTelemetry = useAgentStore.getState().telemetry;
      const jiraTickets = useAgentStore.getState().jiraTickets;

      // 1. RENDER CENTER MONITOR (Terminal & Active Code)
      const cCtx = state.centerCtx;
      const cw = state.centerCanvas.width;
      const ch = state.centerCanvas.height;
      cCtx.fillStyle = '#050914';
      cCtx.fillRect(0, 0, cw, ch);

      cCtx.fillStyle = '#06b6d4';
      cCtx.font = 'bold 24px monospace';
      cCtx.fillText(`// CYBER-OPERATOR CLI -- [${currentStatus}]`, 30, 48);

      if (currentTaskData) {
        cCtx.fillStyle = '#f8fafc';
        cCtx.font = 'bold 20px monospace';
        cCtx.fillText(`TASK: ${currentTaskData.title.slice(0, 44)}`, 30, 88);

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
        cCtx.fillText('System Standby. Click Jira whiteboard to dispatch tickets.', 30, 88);
      }

      cCtx.font = '17px monospace';
      currentLogs.forEach((line, idx) => {
        cCtx.fillStyle = idx === 0 ? '#38bdf8' : '#cbd5e1';
        cCtx.fillText(line, 30, 205 + idx * 34);
      });

      if (Math.floor(elapsedTime * 2.5) % 2 === 0) {
        cCtx.fillStyle = '#06b6d4';
        cCtx.fillRect(30, 205 + currentLogs.length * 34 - 16, 14, 20);
      }

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

      lCtx.fillStyle = '#38bdf8';
      lCtx.font = 'bold 16px monospace';
      lCtx.fillText('NEURAL FREQUENCY', 25, 275);

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

      // 3. RENDER RIGHT MONITOR (Jira Sprint & Pipeline)
      const rCtx = state.rightCtx;
      const rw = state.rightCanvas.width;
      const rh = state.rightCanvas.height;
      rCtx.fillStyle = '#050914';
      rCtx.fillRect(0, 0, rw, rh);

      rCtx.fillStyle = '#10b981';
      rCtx.font = 'bold 24px monospace';
      rCtx.fillText('JIRA SPRINT 34', 25, 48);

      const doneCount = jiraTickets.filter((t) => t.status === 'DONE').length;
      rCtx.fillStyle = '#e2e8f0';
      rCtx.font = '18px monospace';
      rCtx.fillText(`ISSUES: ${doneCount}/${jiraTickets.length} COMPLETED`, 25, 95);
      rCtx.fillText('BRANCH: main [0f8b1c]', 25, 135);
      rCtx.fillText('PIPELINE: PASSED (100%)', 25, 175);
      rCtx.fillText('SECURITY: 0 CVEs DETECTED', 25, 215);

      rCtx.fillStyle = '#38bdf8';
      rCtx.font = 'bold 16px monospace';
      rCtx.fillText('SPRINT TICKETS', 25, 270);

      jiraTickets.slice(0, 3).forEach((t, i) => {
        rCtx.fillStyle = t.status === 'DONE' ? '#10b981' : t.status === 'IN_PROGRESS' ? '#f59e0b' : '#06b6d4';
        rCtx.beginPath();
        rCtx.arc(45, 320 + i * 44, 7, 0, Math.PI * 2);
        rCtx.fill();

        rCtx.fillStyle = '#94a3b8';
        rCtx.font = '15px monospace';
        rCtx.fillText(`${t.key} // ${t.title.slice(0, 22)}...`, 68, 325 + i * 44);
      });

      rCtx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      for (let y = 0; y < rh; y += 4) {
        rCtx.fillRect(0, y, rw, 2);
      }
      state.rightTexture.needsUpdate = true;

      // 4. ANIMATE FLYING HOVERCARS
      state.hovercars.forEach((car) => {
        car.group.position.x += car.speed * delta;
        if (car.speed > 0 && car.group.position.x > car.endX) {
          car.group.position.x = car.startX;
        } else if (car.speed < 0 && car.group.position.x < car.startX) {
          car.group.position.x = car.endX;
        }
      });

      // 5. ANIMATE SPINNING SERVER FANS & LEDS
      state.serverFans.forEach((fan) => {
        fan.rotation.z += delta * (currentStatus === 'PROCESSING' ? 24 : 8);
      });

      const ledSpeed = currentStatus === 'PROCESSING' ? 8 : 2;
      state.serverLeds.forEach((led, idx) => {
        const mat = led.material as THREE.MeshBasicMaterial;
        const blink = Math.sin(elapsedTime * ledSpeed + idx * 1.5) > 0.1;
        mat.color.setHex(blink ? 0x06b6d4 : 0x0f172a);
      });

      // 6. ANIMATE FLOATING DRONE ("Byte-01")
      const droneAngle = elapsedTime * 0.8;
      const droneRadius = 2.2;
      state.droneGroup.position.x = Math.cos(droneAngle) * droneRadius;
      state.droneGroup.position.z = 0.6 + Math.sin(droneAngle) * 1.1;
      state.droneGroup.position.y = 2.7 + Math.sin(elapsedTime * 2.5) * 0.12; // Bobbing
      state.droneGroup.rotation.y = -droneAngle + Math.PI / 2;
      state.droneGroup.rotation.z = Math.sin(elapsedTime * 2.5) * 0.1; // Banking

      // 7. ANIMATE STEAM PARTICLES
      const posAttr = state.steamParticles.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < posAttr.count; i++) {
        let y = posAttr.getY(i) + delta * 0.15;
        if (y > 2.2) y = 1.6;
        posAttr.setY(i, y);
      }
      posAttr.needsUpdate = true;

      // 8. ANIMATE AMBIENT ROOM DUST
      const dustAttr = state.ambientDust.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < dustAttr.count; i++) {
        let y = dustAttr.getY(i) - delta * 0.08;
        if (y < 0.2) y = 5.5;
        dustAttr.setY(i, y);
      }
      dustAttr.needsUpdate = true;

      // 9. ANIMATE HOLOGRAPHIC NEURAL MATRIX CORE
      state.hologramCore.rotation.x += delta * 1.5;
      state.hologramCore.rotation.y += delta * 2.2;

      // Animate upward floating hologram particles
      const hPartAttr = state.hologramParticles.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < hPartAttr.count; i++) {
        let y = hPartAttr.getY(i) + delta * 0.6;
        if (y > 0) y = -2.2;
        hPartAttr.setY(i, y);
      }
      hPartAttr.needsUpdate = true;

      // 10. ROBOT AVATAR ANIMATION STATE MACHINE
      const { head, torso, visor, reactor, reactorLight, leftArm, rightArm } = state.robotParts;

      if (robotEmotion === 'WAVING') {
        // Friendly waving greeting animation
        rightArm.rotation.x = -1.6;
        rightArm.rotation.z = 0.4 + Math.sin(elapsedTime * 12) * 0.3; // Hand wave
        leftArm.rotation.x = 0.05;
        head.rotation.x = -0.1;
        head.rotation.y = 0.2;

        (visor.material as THREE.MeshBasicMaterial).color.setHex(0x38bdf8);
        (reactor.material as THREE.MeshBasicMaterial).color.setHex(0x38bdf8);
        reactorLight.color.setHex(0x38bdf8);
        reactorLight.intensity = 2.5;
      } else if (currentStatus === 'PROCESSING') {
        const typingSpeed = 26;
        leftArm.rotation.x = 0.15 + Math.sin(elapsedTime * typingSpeed) * 0.18;
        leftArm.rotation.z = 0;
        rightArm.rotation.x = 0.15 + Math.cos(elapsedTime * typingSpeed) * 0.18;
        rightArm.rotation.z = 0;

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
        leftArm.rotation.z = 0;
        rightArm.rotation.x = 0.05 + Math.cos(elapsedTime * 0.8) * 0.03;
        rightArm.rotation.z = 0;

        (visor.material as THREE.MeshBasicMaterial).color.setHex(0x06b6d4);
        (reactor.material as THREE.MeshBasicMaterial).color.setHex(0x06b6d4);
        reactorLight.color.setHex(0x06b6d4);
        reactorLight.intensity = 1.2;

        state.hologramBeam.visible = false;
        state.hologramLight.intensity = 0;
      }

      // 11. CONFETTI UPDATE
      if (state.confettiActive) {
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
      containerEl.removeEventListener('mousemove', handleMouseMove);
      containerEl.removeEventListener('click', handleClick);
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

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden select-none cursor-grab active:cursor-grabbing bg-[#04060d]"
    >
      <canvas ref={canvasRef} className="w-full h-full block outline-none" />

      {/* Hover Object Tooltip Badge */}
      {hoveredObjectInfo && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-cyan-500/50 bg-slate-950/80 backdrop-blur-md shadow-xl text-xs font-mono text-cyan-300 pointer-events-none animate-fadeIn">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Interactive: <strong className="text-white">{hoveredObjectInfo}</strong> (Click to interact)</span>
        </div>
      )}

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
      <div className="absolute bottom-28 left-6 z-20 flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-800/80 bg-slate-950/70 backdrop-blur-md text-xs text-slate-400 pointer-events-none">
        <RotateCcw className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
        <span>Click 3D Objects (Robot, Jira Whiteboard, Monitors) • Drag to orbit</span>
      </div>
    </div>
  );
};
