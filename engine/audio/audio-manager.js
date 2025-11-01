/**
 * Audio Manager for Vivid Game Engine
 * Handles background audio (looping) and sound effects (one-shot)
 */

export class AudioManager {
    constructor() {
        this.backgroundAudios = [];
        this.soundEffects = new Map();
        this.backgroundVolume = 0.3;
        this.sfxVolume = 0.7;
        this.audioContext = null;
        this.enabled = true;
        
        // Initialize audio context on user interaction
        this.#initializeAudioContext();
    }

    #initializeAudioContext() {
        // Modern browsers require user interaction before playing audio
        const initAudio = () => {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
            document.removeEventListener('click', initAudio);
            document.removeEventListener('keydown', initAudio);
        };

        document.addEventListener('click', initAudio, { once: true });
        document.addEventListener('keydown', initAudio, { once: true });
    }

    /**
     * Play background audio for a location. Supports single audio or array of audios.
     * @param {string|string[]} audioFiles - Single audio file path or array of paths
     */
    playBackgroundAudio(audioFiles) {
        if (!this.enabled) return;

        // Stop and clear existing background audio
        this.stopBackgroundAudio();

        if (!audioFiles) return;

        // Handle both single string and array
        const files = Array.isArray(audioFiles) ? audioFiles : [audioFiles];
        
        files.forEach(audioFile => {
            if (!audioFile) return;
            
            const audio = new Audio(audioFile);
            audio.loop = true;
            audio.volume = this.backgroundVolume;
            
            audio.addEventListener('error', (e) => {
                console.warn(`Failed to load background audio: ${audioFile}`, e);
            });

            // Play with error handling
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.warn(`Audio playback failed: ${audioFile}`, error);
                });
            }

            this.backgroundAudios.push(audio);
        });
    }

    /**
     * Stop all background audio
     */
    stopBackgroundAudio() {
        this.backgroundAudios.forEach(audio => {
            audio.pause();
            audio.currentTime = 0;
            audio.src = '';
        });
        this.backgroundAudios = [];
    }

    /**
     * Fade out background audio over a duration
     * @param {number} duration - Duration in milliseconds
     */
    fadeOutBackgroundAudio(duration = 1000) {
        if (this.backgroundAudios.length === 0) return Promise.resolve();

        const fadeSteps = 20;
        const fadeInterval = duration / fadeSteps;
        
        return Promise.all(this.backgroundAudios.map(audio => {
            return new Promise(resolve => {
                const startVolume = audio.volume;
                let step = 0;

                const fadeTimer = setInterval(() => {
                    step++;
                    const progress = step / fadeSteps;
                    audio.volume = Math.max(0, startVolume * (1 - progress));

                    if (step >= fadeSteps) {
                        clearInterval(fadeTimer);
                        audio.pause();
                        resolve();
                    }
                }, fadeInterval);
            });
        })).then(() => {
            this.stopBackgroundAudio();
        });
    }

    /**
     * Fade in background audio over a duration
     * @param {string|string[]} audioFiles - Audio file(s) to play
     * @param {number} duration - Duration in milliseconds
     */
    fadeInBackgroundAudio(audioFiles, duration = 1000) {
        if (!this.enabled || !audioFiles) return;

        const files = Array.isArray(audioFiles) ? audioFiles : [audioFiles];
        const fadeSteps = 20;
        const fadeInterval = duration / fadeSteps;

        files.forEach(audioFile => {
            if (!audioFile) return;

            const audio = new Audio(audioFile);
            audio.loop = true;
            audio.volume = 0;

            audio.addEventListener('error', (e) => {
                console.warn(`Failed to load background audio: ${audioFile}`, e);
            });

            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    let step = 0;
                    const fadeTimer = setInterval(() => {
                        step++;
                        const progress = step / fadeSteps;
                        audio.volume = Math.min(this.backgroundVolume, this.backgroundVolume * progress);

                        if (step >= fadeSteps) {
                            clearInterval(fadeTimer);
                        }
                    }, fadeInterval);
                }).catch(error => {
                    console.warn(`Audio playback failed: ${audioFile}`, error);
                });
            }

            this.backgroundAudios.push(audio);
        });
    }

    /**
     * Play a sound effect once
     * @param {string} soundFile - Path to sound effect file
     * @param {Object} options - Playback options
     */
    playSoundEffect(soundFile, options = {}) {
        if (!this.enabled || !soundFile) return;

        const {
            volume = this.sfxVolume,
            onComplete = null
        } = options;

        // Check if we already have this sound loaded
        let audio = this.soundEffects.get(soundFile);
        
        if (!audio) {
            audio = new Audio(soundFile);
            audio.volume = volume;
            
            audio.addEventListener('error', (e) => {
                console.warn(`Failed to load sound effect: ${soundFile}`, e);
            });

            this.soundEffects.set(soundFile, audio);
        } else {
            // Reset if already playing
            audio.currentTime = 0;
            audio.volume = volume;
        }

        if (onComplete) {
            audio.addEventListener('ended', onComplete, { once: true });
        }

        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.warn(`Sound effect playback failed: ${soundFile}`, error);
            });
        }
    }

    /**
     * Play a sequence of sound effects in order
     * @param {string[]} soundFiles - Array of sound effect paths
     * @param {Function} onComplete - Callback when sequence completes
     */
    playSoundSequence(soundFiles, onComplete = null) {
        if (!this.enabled || !soundFiles || soundFiles.length === 0) {
            if (onComplete) onComplete();
            return;
        }

        let currentIndex = 0;

        const playNext = () => {
            if (currentIndex >= soundFiles.length) {
                if (onComplete) onComplete();
                return;
            }

            const soundFile = soundFiles[currentIndex];
            currentIndex++;

            this.playSoundEffect(soundFile, {
                onComplete: playNext
            });
        };

        playNext();
    }

    /**
     * Set background audio volume (0.0 to 1.0)
     */
    setBackgroundVolume(volume) {
        this.backgroundVolume = Math.max(0, Math.min(1, volume));
        this.backgroundAudios.forEach(audio => {
            audio.volume = this.backgroundVolume;
        });
    }

    /**
     * Set sound effects volume (0.0 to 1.0)
     */
    setSfxVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
    }

    /**
     * Enable or disable all audio
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled) {
            this.stopBackgroundAudio();
        }
    }

    /**
     * Cleanup all audio resources
     */
    dispose() {
        this.stopBackgroundAudio();
        this.soundEffects.forEach(audio => {
            audio.pause();
            audio.src = '';
        });
        this.soundEffects.clear();
    }
}
