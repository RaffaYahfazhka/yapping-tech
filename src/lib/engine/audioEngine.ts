// @ts-nocheck
/**
 * YouTube IFrame Player API Audio Engine
 *
 * Kenapa ditulis ulang:
 * - React Strict Mode (dev) me-mount effect 2x. Versi lama membuat 2 engine yang
 *   sama-sama menunggu `onYouTubeIframeAPIReady`, lalu keduanya memanggil
 *   `new YT.Player('yt-player-host')`. Engine pertama (yang sudah di-destroy)
 *   mengganti div host dengan iframe, engine kedua menempel ke iframe tsb dan
 *   `onReady` tidak pernah terpanggil → audio tidak jalan & detik diam di 0:00.
 * - Sekarang: loader API singleton (Promise), setiap engine membuat node mount
 *   sendiri di dalam host, dan ada guard `destroyed`.
 */

export type AudioStatus = 'idle' | 'loading' | 'buffering' | 'playing' | 'paused' | 'ended' | 'error';

let ytApiPromise = null;

function loadYouTubeApi() {
  if (typeof window === 'undefined') return Promise.reject(new Error('SSR'));
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
  if (ytApiPromise) return ytApiPromise;

  ytApiPromise = new Promise((resolve, reject) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof prev === 'function') {
        try { prev(); } catch (e) {}
      }
      resolve(window.YT);
    };

    if (!document.getElementById('yt-iframe-script')) {
      const tag = document.createElement('script');
      tag.id = 'yt-iframe-script';
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      tag.onerror = () => {
        ytApiPromise = null;
        reject(new Error('Gagal memuat YouTube IFrame API (cek koneksi / adblock).'));
      };
      document.head.appendChild(tag);
    }

    // Safety net: kalau callback global ditimpa script lain, poll YT.Player.
    const started = Date.now();
    const poll = setInterval(() => {
      if (window.YT && window.YT.Player) {
        clearInterval(poll);
        resolve(window.YT);
      } else if (Date.now() - started > 15000) {
        clearInterval(poll);
        ytApiPromise = null;
        reject(new Error('Timeout memuat YouTube IFrame API.'));
      }
    }, 250);
  });

  return ytApiPromise;
}

const YT_ERRORS = {
  2: 'Video ID tidak valid',
  5: 'Video tidak bisa diputar di player HTML5',
  100: 'Video tidak ditemukan / private',
  101: 'Pemilik video melarang embed',
  150: 'Pemilik video melarang embed',
};

export class AudioEngine {
  constructor(options = {}) {
    this.videoId = options.videoId || 'NA7hmTexZ0E';
    this.playlistId = null;
    this.containerId = options.containerId || 'yt-player-host';
    this.onStateChange = options.onStateChange || (() => {});
    this.onTimeUpdate = options.onTimeUpdate || (() => {});
    this.onEnded = options.onEnded || (() => {});

    this.player = null;
    this.mountEl = null;
    this.isReady = false;
    this.wantsPlay = false; // intent user
    this.status = 'idle';
    this.errorMessage = null;
    this.isMuted = false;
    this.volume = 60;
    this.duration = 0;
    this.currentTime = 0;
    this.destroyed = false;
    this.pollTimer = null;
    this.consecutiveErrors = 0;
  }

  /* ───────────────────────── lifecycle ───────────────────────── */

  init() {
    if (typeof window === 'undefined') return;
    this.setStatus('loading');
    loadYouTubeApi()
      .then(() => {
        if (!this.destroyed) this.createPlayer();
      })
      .catch((err) => {
        if (this.destroyed) return;
        this.errorMessage = err.message;
        this.setStatus('error');
      });
  }

  createPlayer() {
    if (this.destroyed || this.player || !window.YT || !window.YT.Player) return;

    const host = document.getElementById(this.containerId);
    if (!host) {
      setTimeout(() => this.createPlayer(), 300);
      return;
    }

    // Node mount milik engine ini — host yang dikelola React tidak pernah diganti.
    host.innerHTML = '';
    this.mountEl = document.createElement('div');
    host.appendChild(this.mountEl);

    this.player = new window.YT.Player(this.mountEl, {
      height: '200',
      width: '200',
      videoId: this.videoId,
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        fs: 0,
        iv_load_policy: 3,
        modestbranding: 1,
        playsinline: 1,
        rel: 0,
        enablejsapi: 1,
      },
      events: {
        onReady: () => {
          if (this.destroyed) return;
          this.isReady = true;
          this.applyVolume();
          if (this.wantsPlay) {
            this.safeCall('playVideo');
            this.setStatus('buffering');
          } else {
            this.setStatus('paused');
          }
          this.startPolling();
        },
        onStateChange: (event) => this.handleYtState(event.data),
        onError: (event) => this.handleYtError(event.data),
      },
    });
  }

  destroy() {
    this.destroyed = true;
    this.stopPolling();
    try {
      this.player?.destroy?.();
    } catch (e) {}
    this.player = null;
    if (this.mountEl?.parentNode) this.mountEl.parentNode.removeChild(this.mountEl);
    this.mountEl = null;
  }

  /* ───────────────────────── YT events ───────────────────────── */

  handleYtState(code) {
    if (this.destroyed) return;
    // -1 UNSTARTED, 0 ENDED, 1 PLAYING, 2 PAUSED, 3 BUFFERING, 5 CUED
    switch (code) {
      case 1:
        this.consecutiveErrors = 0;
        this.errorMessage = null;
        this.wantsPlay = true;
        this.setStatus('playing');
        break;
      case 2:
        // Do not reset this.wantsPlay here because YouTube can emit brief pause during loading
        this.setStatus('paused');
        break;
      case 3:
        this.setStatus('buffering');
        break;
      case 0:
        this.setStatus('ended');
        this.onEnded();
        break;
      case 5:
        if (this.wantsPlay) {
          this.safeCall('playVideo');
        } else {
          this.setStatus('paused');
        }
        break;
      case -1:
        if (this.wantsPlay) {
          this.safeCall('playVideo');
        }
        break;
      default:
        break;
    }
    this.emitTime();
  }

  handleYtError(code) {
    if (this.destroyed) return;
    this.errorMessage = YT_ERRORS[code] || `YouTube error ${code}`;
    console.warn('[AudioEngine]', this.errorMessage, `(code ${code}, video ${this.videoId})`);
    this.consecutiveErrors += 1;
    this.setStatus('error');
    // Skip otomatis hanya untuk video yang memang tidak bisa diputar, maksimal 3x berturut-turut
    if ([100, 101, 150].includes(code) && this.consecutiveErrors <= 3) {
      setTimeout(() => !this.destroyed && this.onEnded(), 800);
    }
  }

  /* ───────────────────────── controls ───────────────────────── */

  loadTrack(videoId) {
    if (!videoId) return;
    this.videoId = videoId;
    this.playlistId = null;
    this.wantsPlay = true;
    this.currentTime = 0;
    this.duration = 0;
    this.errorMessage = null;
    this.emitTime();

    if (this.player && this.isReady) {
      this.safeCall('loadVideoById', videoId);
      this.applyVolume();
      this.safeCall('playVideo');
      this.setStatus('buffering');
    } else {
      this.setStatus('loading');
      if (!this.player) this.init();
    }
  }

  loadPlaylist(playlistId) {
    if (!playlistId) return;
    this.playlistId = playlistId;
    this.wantsPlay = true;
    this.currentTime = 0;
    if (this.player && this.isReady) {
      this.safeCall('loadPlaylist', { list: playlistId, listType: 'playlist' });
      this.applyVolume();
      this.setStatus('buffering');
    } else {
      this.setStatus('loading');
    }
  }

  play() {
    this.wantsPlay = true;
    if (this.player && this.isReady) {
      this.applyVolume();
      this.safeCall('playVideo');
      if (this.status !== 'playing') this.setStatus('buffering');
    } else {
      this.setStatus('loading');
      if (!this.player) this.init();
    }
  }

  pause() {
    this.wantsPlay = false;
    this.safeCall('pauseVideo');
    this.setStatus('paused');
  }

  togglePlay() {
    if (this.status === 'playing' || this.status === 'buffering' || (this.status === 'loading' && this.wantsPlay)) {
      this.pause();
    } else {
      this.play();
    }
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(100, Number(vol) || 0));
    if (this.volume > 0 && this.isMuted) this.isMuted = false;
    this.applyVolume();
    this.emitState();
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    this.applyVolume();
    this.emitState();
  }

  seekTo(seconds) {
    const sec = Math.max(0, Number(seconds) || 0);
    this.currentTime = sec;
    this.safeCall('seekTo', sec, true);
    this.emitTime();
  }

  /* ───────────────────────── internals ───────────────────────── */

  safeCall(method, ...args) {
    const p = this.player;
    if (!p || typeof p[method] !== 'function') return undefined;
    try {
      return p[method](...args);
    } catch (e) {
      console.warn(`[AudioEngine] ${method} gagal`, e);
      return undefined;
    }
  }

  applyVolume() {
    if (!this.player || !this.isReady) return;
    this.safeCall('setVolume', this.volume);
    if (this.isMuted || this.volume === 0) this.safeCall('mute');
    else this.safeCall('unMute');
  }

  setStatus(status) {
    this.status = status;
    this.emitState();
  }

  emitState() {
    this.onStateChange({
      ready: this.isReady,
      status: this.status,
      isPlaying: this.status === 'playing',
      isLoading: this.status === 'loading' || this.status === 'buffering',
      error: this.status === 'error' ? this.errorMessage : null,
      volume: this.volume,
      isMuted: this.isMuted,
    });
  }

  emitTime() {
    this.onTimeUpdate({ currentTime: this.currentTime, duration: this.duration });
  }

  startPolling() {
    this.stopPolling();
    this.pollTimer = setInterval(() => {
      if (this.destroyed || !this.player || !this.isReady) return;
      const cur = this.safeCall('getCurrentTime');
      const dur = this.safeCall('getDuration');
      let changed = false;
      if (typeof cur === 'number' && !Number.isNaN(cur) && Math.abs(cur - this.currentTime) > 0.05) {
        this.currentTime = cur;
        changed = true;
      }
      if (typeof dur === 'number' && dur > 0 && dur !== this.duration) {
        this.duration = dur;
        changed = true;
      }
      if (changed) this.emitTime();
    }, 250);
  }

  stopPolling() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }
}
