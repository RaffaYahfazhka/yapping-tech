import { CAMERA_YAW } from './constants';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  SCREEN-RELATIVE MOVEMENT (ANTI-INVERTED)
 * ─────────────────────────────────────────────────────────────────────────────
 *  Input layar (konvensi):
 *    moveX = +1 → KANAN layar (D / →)     moveX = -1 → KIRI layar (A / ←)
 *    moveZ = -1 → ATAS layar  (W / ↑)     moveZ = +1 → BAWAH layar (S / ↓)
 *
 *  Rumus rotasi 2D sesuai spesifikasi:
 *    worldX = moveX * cos(angle) - moveZ * sin(angle)
 *    worldZ = moveX * sin(angle) + moveZ * cos(angle)
 *
 *  Kamera berada di (+18, +20, +18) → heading kamera = +π/4. Rumus di atas memutar
 *  vektor dari sumbu +X menuju +Z, sedangkan heading kamera three.js (rotasi Y)
 *  memutar dari +Z menuju +X. Karena arah putarnya berlawanan, sudut yang benar
 *  adalah angle = -CAMERA_YAW. Jika langsung memakai +π/4, tombol W justru
 *  berjalan ke KANAN layar (terputar 90°) — itulah bug "inverted" klasik.
 *
 *  Hasil (terverifikasi `yarn test:movement` + self-check runtime via proyeksi kamera):
 *    W → (-0.707, -0.707)  menjauhi kamera  = atas layar
 *    S → (+0.707, +0.707)  mendekati kamera = bawah layar
 *    A → (-0.707, +0.707)  kiri layar
 *    D → (+0.707, -0.707)  kanan layar
 */
export function screenToWorld(moveX, moveZ, cameraYaw = CAMERA_YAW) {
  const angle = -cameraYaw;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const worldX = moveX * cos - moveZ * sin;
  const worldZ = moveX * sin + moveZ * cos;
  return { x: worldX, z: worldZ };
}

/** Rotasi Y agar model (yang menghadap +Z) menghadap arah jalan. */
export function facingFromDirection(worldX, worldZ) {
  return Math.atan2(worldX, worldZ);
}

/** Interpolasi sudut lewat jalur terpendek. */
export function dampAngle(current, target, lambda, dt) {
  let delta = ((target - current + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (delta < -Math.PI) delta += Math.PI * 2;
  return current + delta * (1 - Math.exp(-lambda * dt));
}

/** Membaca input keyboard → vektor layar ternormalisasi. */
export function readScreenInput(keys) {
  const right = keys.has('KeyD') || keys.has('ArrowRight');
  const left = keys.has('KeyA') || keys.has('ArrowLeft');
  const down = keys.has('KeyS') || keys.has('ArrowDown');
  const up = keys.has('KeyW') || keys.has('ArrowUp');
  let moveX = (right ? 1 : 0) - (left ? 1 : 0);
  let moveZ = (down ? 1 : 0) - (up ? 1 : 0);
  const len = Math.hypot(moveX, moveZ);
  if (len > 0) {
    moveX /= len;
    moveZ /= len;
  }
  return { moveX, moveZ, active: len > 0 };
}
