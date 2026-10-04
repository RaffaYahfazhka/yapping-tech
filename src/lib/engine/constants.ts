/**
 * Konstanta engine. Murni angka (tanpa import three) supaya bisa dites di Node.
 */

/** Offset kamera isometrik dari titik fokus. */
export const CAMERA_OFFSET = { x: 18, y: 20, z: 18 };

/**
 * Yaw (heading) kamera = Math.atan2(18, 18) = Math.PI / 4 (45°).
 * Catatan: jangan baca dari camera.rotation.y — untuk kamera miring hasil lookAt,
 * Euler XYZ memberi ~33.8°, bukan 45°. Heading harus dihitung dari offset.
 */
export const CAMERA_YAW = Math.atan2(CAMERA_OFFSET.x, CAMERA_OFFSET.z);

/** Tinggi area yang terlihat (world units) pada zoom 1 untuk OrthographicCamera. */
export const VIEW_SIZE = 26;

export const ROOM = { minX: -16, maxX: 16, minZ: -12, maxZ: 12, wallH: 4.4 };

export const PLAYER = { radius: 0.36, speed: 4.4, sprint: 1.75 };

export const PALETTE = {
  floor: '#cdc4b6',
  slab: '#2b2724',
  wall: '#e6e0d6',
  wallTrim: '#b9afa1',
  desk: '#f2eee7',
  deskLeg: '#2a2a2e',
  chair: '#26262b',
  wood: '#a47b55',
  emerald: '#10b981',
  violet: '#8b5cf6',
};
