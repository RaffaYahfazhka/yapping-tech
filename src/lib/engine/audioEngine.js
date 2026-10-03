/**
 * YouTube IFrame Player API Audio Engine
 * Track: CHON — Pitch Dark (Video ID: sF80I-TQiW0)
 */
export class AudioEngine {
  constructor(options = {}) {
    this.videoId = 'sF80I-TQiW0';
    this.containerId = options.containerId || 'yt-player-host';
    this.onStateChange = options.onStateChange || (() => {});
    this.onTimeUpdate = options.onTimeUpdate || (() => {});

    this.player = null;
    this.isReady = false;
    this.isPlaying = false;
    this.isMuted = false;
    this.volume = 50;
    this.duration = 196; // 3:16 for Pitch Dark
    this.currentTime = 0;

    this.pollTimer = null;
  }

  init() {
    if (typeof window === 'undefined') return;

    if (window.YT && window.YT.Player) {
      this.createPlayer();
      return;
    }

    // Load YouTube IFrame API script
    const prevOnYouTube = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (prevOnYouTube) prevOnYouTube();
      this.createPlayer();
    };

    if (!document.getElementById('yt-iframe-script')) {
      const tag = document.createElement('script');
      tag.id = 'yt-iframe-script';
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }
  }

  createPlayer() {
    if (this.player || !window.YT || !window.YT.Player) return;

    let targetEl = document.getElementById(this.containerId);
    if (!targetEl) {
      targetEl = document.createElement('div');
      targetEl.id = this.containerId;
      targetEl.style.position = 'fixed';
      targetEl.style.bottom = '-9999px';
      targetEl.style.left = '-9999px';
      targetEl.style.width = '1px';
      targetEl.style.height = '1px';
      targetEl.style.opacity = '0';
      targetEl.style.pointerEvents = 'none';
      document.body.appendChild(targetEl);
    }

    try {
      this.player = new window.YT.Player(this.containerId, {
        height: '180',
        width: '320',
        videoId: this.videoId,
        playerVars: {
          autoplay: 0,
          controls: 0,
          loop: 1,
          playlist: this.videoId,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
          origin: typeof window !== 'undefined' ? window.location.origin : '',
        },
        events: {
          onReady: (event) => {
            this.isReady = true;
            this.player.setVolume(this.volume);
            this.onStateChange({ ready: true, isPlaying: this.isPlaying, volume: this.volume });
          },
          onStateChange: (event) => {
            // YT.PlayerState: PLAYING = 1, PAUSED = 2, ENDED = 0, BUFFERING = 3
            if (event.data === 1) {
              this.isPlaying = true;
              this.startPolling();
            } else if (event.data === 2 || event.data === 0) {
              this.isPlaying = false;
              this.stopPolling();
            }
            this.onStateChange({
              ready: this.isReady,
              isPlaying: this.isPlaying,
              volume: this.volume,
              isMuted: this.isMuted,
            });
          },
        },
      });
    } catch (e) {
      console.warn('YouTube Player initialization fallback', e);
    }
  }

  play() {
    if (this.player && this.player.playVideo) {
      this.player.playVideo();
      this.isPlaying = true;
      this.startPolling();
    } else {
      this.isPlaying = true;
    }
    this.onStateChange({ ready: this.isReady, isPlaying: true, volume: this.volume, isMuted: this.isMuted });
  }

  pause() {
    if (this.player && this.player.pauseVideo) {
      this.player.pauseVideo();
    }
    this.isPlaying = false;
    this.stopPolling();
    this.onStateChange({ ready: this.isReady, isPlaying: false, volume: this.volume, isMuted: this.isMuted });
  }

  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(100, vol));
    if (this.player && this.player.setVolume) {
      this.player.setVolume(this.volume);
      if (this.isMuted && this.volume > 0) {
        this.player.unMute();
        this.isMuted = false;
      }
    }
    this.onStateChange({ ready: this.isReady, isPlaying: this.isPlaying, volume: this.volume, isMuted: this.isMuted });
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.player) {
      if (this.isMuted && this.player.mute) {
        this.player.mute();
      } else if (!this.isMuted && this.player.unMute) {
        this.player.unMute();
      }
    }
    this.onStateChange({ ready: this.isReady, isPlaying: this.isPlaying, volume: this.volume, isMuted: this.isMuted });
  }

  seekTo(seconds) {
    if (this.player && this.player.seekTo) {
      this.player.seekTo(seconds, true);
    }
  }

  startPolling() {
    this.stopPolling();
    this.pollTimer = setInterval(() => {
      if (this.player && this.player.getCurrentTime) {
        this.currentTime = this.player.getCurrentTime() || 0;
        this.duration = this.player.getDuration() || 196;
        this.onTimeUpdate({ currentTime: this.currentTime, duration: this.duration });
      }
    }, 500);
  }

  stopPolling() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  destroy() {
    this.stopPolling();
    if (this.player && this.player.destroy) {
      this.player.destroy();
    }
  }
}
