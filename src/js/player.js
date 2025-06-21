
// video_monitoring_replay_service/frontend/js/player.js
class VideoPlayer {
    constructor(videoElement) {
        this.video = videoElement;
        this.playbackRates = [0.25, 0.5, 1.0, 1.5, 2.0];
        this.currentRateIndex = 2;
        this.frameStep = 0.1;
        this.pipEnabled = false;
        this.annotations = [];
        this.initEventListeners();
    }

    initEventListeners() {
        this.video.addEventListener('timeupdate', this.updateProgress.bind(this));
        this.video.addEventListener('loadedmetadata', this.setupDuration.bind(this));
        this.video.addEventListener('enterpictureinpicture', () => this.pipEnabled = true);
        this.video.addEventListener('leavepictureinpicture', () => this.pipEnabled = false);
    }

    setupDuration() {
        if (this.durationElement) {
            this.durationElement.textContent = this.formatTime(this.video.duration);
        }
    }

    updateProgress() {
        if (this.progressBar) {
            const progress = (this.video.currentTime / this.video.duration) * 100;
            this.progressBar.value = progress;
        }
        if (this.currentTimeElement) {
            this.currentTimeElement.textContent = this.formatTime(this.video.currentTime);
        }
    }

    play() {
        this.video.play();
        this.video.playbackRate = this.playbackRates[this.currentRateIndex];
    }

    pause() {
        this.video.pause();
    }

    stop() {
        this.pause();
        this.video.currentTime = 0;
    }

    togglePlayPause() {
        if (this.video.paused) {
            this.play();
        } else {
            this.pause();
        }
    }

    changePlaybackRate() {
        this.currentRateIndex = (this.currentRateIndex + 1) % this.playbackRates.length;
        this.video.playbackRate = this.playbackRates[this.currentRateIndex];
        return this.playbackRates[this.currentRateIndex];
    }

    setPlaybackRate(rateIndex) {
        if (rateIndex >= 0 && rateIndex < this.playbackRates.length) {
            this.currentRateIndex = rateIndex;
            this.video.playbackRate = this.playbackRates[rateIndex];
        }
    }

    seek(percentage) {
        const time = (percentage / 100) * this.video.duration;
        this.video.currentTime = time;
    }

    stepForward() {
        this.video.currentTime = Math.min(
            this.video.duration,
            this.video.currentTime + this.frameStep
        );
    }

    stepBackward() {
        this.video.currentTime = Math.max(
            0,
            this.video.currentTime - this.frameStep
        );
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            this.video.requestFullscreen().catch(err => {
                console.error(`全屏错误: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    }

    togglePictureInPicture() {
        if (!this.pipEnabled) {
            this.video.requestPictureInPicture()
                .catch(error => {
                    console.error('画中画模式错误:', error);
                });
        } else {
            document.exitPictureInPicture()
                .catch(error => {
                    console.error('退出画中画错误:', error);
                });
        }
    }

    addAnnotation(text, timestamp) {
        const annotation = {
            id: Date.now(),
            text,
            timestamp: timestamp || this.video.currentTime,
            createdAt: new Date()
        };
        this.annotations.push(annotation);
        return annotation;
    }

    removeAnnotation(id) {
        this.annotations = this.annotations.filter(anno => anno.id !== id);
    }

    getAnnotationsAtCurrentTime() {
        const currentTime = this.video.currentTime;
        return this.annotations.filter(anno => 
            Math.abs(anno.timestamp - currentTime) < 0.5
        );
    }

    formatTime(seconds) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    bindControls({
        playBtn,
        pauseBtn,
        stopBtn,
        speedBtn,
        prevFrameBtn,
        nextFrameBtn,
        fullscreenBtn,
        pipBtn,
        annotateBtn,
        progressBar,
        currentTimeElement,
        durationElement
    }) {
        if (playBtn) playBtn.addEventListener('click', this.play.bind(this));
        if (pauseBtn) pauseBtn.addEventListener('click', this.pause.bind(this));
        if (stopBtn) stopBtn.addEventListener('click', this.stop.bind(this));
        if (speedBtn) speedBtn.addEventListener('click', this.changePlaybackRate.bind(this));
        if (prevFrameBtn) prevFrameBtn.addEventListener('click', this.stepBackward.bind(this));
        if (nextFrameBtn) nextFrameBtn.addEventListener('click', this.stepForward.bind(this));
        if (fullscreenBtn) fullscreenBtn.addEventListener('click', this.toggleFullscreen.bind(this));
        if (pipBtn) pipBtn.addEventListener('click', this.togglePictureInPicture.bind(this));
        if (annotateBtn) annotateBtn.addEventListener('click', () => {
            const text = prompt('请输入标注内容:');
            if (text) this.addAnnotation(text);
        });
        if (progressBar) {
            this.progressBar = progressBar;
            progressBar.addEventListener('input', (e) => this.seek(e.target.value));
        }
        if (currentTimeElement) this.currentTimeElement = currentTimeElement;
        if (durationElement) this.durationElement = durationElement;
    }

    syncWith(otherPlayer) {
        if (!otherPlayer || !(otherPlayer instanceof VideoPlayer)) return;
        
        this.video.addEventListener('play', () => otherPlayer.play());
        this.video.addEventListener('pause', () => otherPlayer.pause());
        this.video.addEventListener('seeked', () => {
            otherPlayer.video.currentTime = this.video.currentTime;
        });
        this.video.addEventListener('ratechange', () => {
            otherPlayer.setPlaybackRate(this.currentRateIndex);
        });
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = VideoPlayer;
} else {
    window.VideoPlayer = VideoPlayer;
}
