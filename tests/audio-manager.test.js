import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AudioManager } from '../engine/audio/audio-manager.js';

// Mock Audio API
class MockAudio {
    constructor(src) {
        this.src = src;
        this.loop = false;
        this.volume = 1;
        this.currentTime = 0;
        this._paused = true;
        this._ended = false;
        this.eventListeners = {};
    }

    play() {
        this._paused = false;
        return Promise.resolve();
    }

    pause() {
        this._paused = true;
    }

    addEventListener(event, callback, options) {
        if (!this.eventListeners[event]) {
            this.eventListeners[event] = [];
        }
        this.eventListeners[event].push({ callback, options });
    }

    removeEventListener(event, callback) {
        if (this.eventListeners[event]) {
            this.eventListeners[event] = this.eventListeners[event].filter(
                listener => listener.callback !== callback
            );
        }
    }

    triggerEvent(event) {
        if (this.eventListeners[event]) {
            this.eventListeners[event].forEach(({ callback, options }) => {
                callback({ type: event });
                if (options?.once) {
                    this.removeEventListener(event, callback);
                }
            });
        }
    }
}

describe('AudioManager', () => {
    let originalAudio;

    beforeEach(() => {
        originalAudio = global.Audio;
        global.Audio = MockAudio;
        vi.useFakeTimers();
    });

    afterEach(() => {
        global.Audio = originalAudio;
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('plays a single background audio file', () => {
        const audio = new AudioManager();
        audio.playBackgroundAudio('audio/bgm/town.ogg');

        expect(audio.backgroundAudios).toHaveLength(1);
        expect(audio.backgroundAudios[0].src).toBe('audio/bgm/town.ogg');
        expect(audio.backgroundAudios[0].loop).toBe(true);
    });

    it('plays multiple background audio files', () => {
        const audio = new AudioManager();
        audio.playBackgroundAudio(['audio/bgse/cave.ogg', 'audio/bgse/water.ogg']);

        expect(audio.backgroundAudios).toHaveLength(2);
        expect(audio.backgroundAudios[0].src).toBe('audio/bgse/cave.ogg');
        expect(audio.backgroundAudios[1].src).toBe('audio/bgse/water.ogg');
    });

    it('stops all background audio when changing locations', () => {
        const audio = new AudioManager();
        audio.playBackgroundAudio('audio/bgm/town.ogg');
        
        const firstAudio = audio.backgroundAudios[0];
        const pauseSpy = vi.spyOn(firstAudio, 'pause');

        audio.stopBackgroundAudio();

        expect(pauseSpy).toHaveBeenCalled();
        expect(audio.backgroundAudios).toHaveLength(0);
    });

    it('plays sound effects', () => {
        const audio = new AudioManager();
        audio.playSoundEffect('audio/sfx/attack.wav');

        expect(audio.soundEffects.size).toBe(1);
        expect(audio.soundEffects.has('audio/sfx/attack.wav')).toBe(true);
    });

    it('plays a sequence of sound effects in order', () => {
        const audio = new AudioManager();
        const sounds = ['audio/sfx/hit1.wav', 'audio/sfx/hit2.wav'];
        
        const onComplete = vi.fn();
        audio.playSoundSequence(sounds, onComplete);

        // First sound should be playing
        expect(audio.soundEffects.has('audio/sfx/hit1.wav')).toBe(true);
    });

    it('sets background volume', () => {
        const audio = new AudioManager();
        audio.playBackgroundAudio('audio/bgm/town.ogg');

        audio.setBackgroundVolume(0.5);

        expect(audio.backgroundVolume).toBe(0.5);
        expect(audio.backgroundAudios[0].volume).toBe(0.5);
    });

    it('clamps volume between 0 and 1', () => {
        const audio = new AudioManager();

        audio.setBackgroundVolume(1.5);
        expect(audio.backgroundVolume).toBe(1);

        audio.setBackgroundVolume(-0.5);
        expect(audio.backgroundVolume).toBe(0);
    });

    it('disables audio playback when setEnabled(false)', () => {
        const audio = new AudioManager();
        audio.setEnabled(false);

        audio.playBackgroundAudio('audio/bgm/town.ogg');
        expect(audio.backgroundAudios).toHaveLength(0);
    });

    it('fades out background audio', async () => {
        const audio = new AudioManager();
        audio.playBackgroundAudio('audio/bgm/town.ogg');

        const fadePromise = audio.fadeOutBackgroundAudio(100);
        
        vi.runAllTimers();
        await fadePromise;

        expect(audio.backgroundAudios).toHaveLength(0);
    });

    it('disposes all audio resources', () => {
        const audio = new AudioManager();
        audio.playBackgroundAudio('audio/bgm/town.ogg');
        audio.playSoundEffect('audio/sfx/attack.wav');

        audio.dispose();

        expect(audio.backgroundAudios).toHaveLength(0);
        expect(audio.soundEffects.size).toBe(0);
    });
});
