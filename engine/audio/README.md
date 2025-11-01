# Audio System

The Vivid game engine includes a comprehensive audio system that supports both background audio (looping ambient sounds and music) and sound effects (one-shot sounds for actions).

## Features

- **Background Audio**: Looping audio for locations (ambient sounds, music)
- **Sound Effects**: One-shot sounds for combat, skills, and actions
- **Multiple Audio Tracks**: Play multiple background sounds simultaneously
- **Fade In/Out**: Smooth transitions between locations and combat
- **Auto-pause**: Browser-compliant audio that starts on user interaction

## Location Audio

### Single Background Audio

Add a single background audio track to a location:

```json
{
    "Name": "King's Vale",
    "Description": "A peaceful village...",
    "BackgroundAudio": "audio/bgse/seagulls.ogg"
}
```

### Multiple Background Audios

Layer multiple audio tracks for richer ambient sound:

```json
{
    "Name": "North Seaside Cave",
    "Description": "A dark, dripping cavern...",
    "BackgroundAudios": [
        "audio/bgse/cave.ogg",
        "audio/bgse/bubbling.ogg"
    ]
}
```

## Battle Audio

Configure a battle theme in your `Game.json`:

```json
{
    "GameName": "My Game",
    "BattleTheme": "audio/bgm/battle.ogg"
}
```

The battle theme automatically:
- Fades out location audio when combat starts
- Plays the battle theme during combat
- Stops battle music and restores location audio when combat ends

## Sound Effects

Sound effects automatically play during combat for:

### Character Attacks
Place audio files at: `audio/sfx/attacks/{character-name}.wav`

Example: `audio/sfx/attacks/aisha.wav`

### Skills
Place audio files at: `audio/sfx/skills/{skill-name}.wav`

Example: `audio/sfx/skills/fire-a.wav`

### Monster Sounds
Place audio files at: `audio/sfx/monsters/{monster-name}.wav`

Example: `audio/sfx/monsters/goblin.wav`

## Audio Format Support

The engine supports common web audio formats:
- **OGG Vorbis** (`.ogg`) - Recommended for background audio
- **WAV** (`.wav`) - Recommended for sound effects
- **MP3** (`.mp3`) - Widely supported fallback

## Directory Structure

Organize your audio files like this:

```
time_eater/
  audio/
    bgm/           # Background music
      battle.ogg
      town.ogg
    bgse/          # Background sound effects (ambient)
      seagulls.ogg
      cave.ogg
      bubbling.ogg
    sfx/           # Sound effects
      attacks/
        attack.wav
        aisha.wav
      skills/
        fire-a.wav
        heal.wav
      monsters/
        goblin.wav
        spider.wav
```

## Volume Control

The audio system has separate volume controls:

- **Background Audio**: Default 0.3 (30%)
- **Sound Effects**: Default 0.7 (70%)

You can adjust these programmatically:

```javascript
// In game engine
gameEngine.audio.setBackgroundVolume(0.5);
gameEngine.audio.setSfxVolume(0.8);
```

## Browser Compatibility

Modern browsers require user interaction before playing audio. The audio system automatically initializes on the first click or keypress, so no additional code is needed.

## Disabling Audio

To disable all audio:

```javascript
gameEngine.audio.setEnabled(false);
```

To re-enable:

```javascript
gameEngine.audio.setEnabled(true);
```

## API Reference

### AudioManager

#### `playBackgroundAudio(audioFiles)`
Play background audio. Accepts a single file path or array of paths.

#### `stopBackgroundAudio()`
Stop all background audio immediately.

#### `fadeOutBackgroundAudio(duration)`
Fade out background audio over specified duration (milliseconds).

#### `fadeInBackgroundAudio(audioFiles, duration)`
Fade in background audio over specified duration.

#### `playSoundEffect(soundFile, options)`
Play a sound effect once. Options: `{ volume, onComplete }`.

#### `playSoundSequence(soundFiles, onComplete)`
Play multiple sound effects in sequence.

#### `setBackgroundVolume(volume)`
Set background audio volume (0.0 to 1.0).

#### `setSfxVolume(volume)`
Set sound effects volume (0.0 to 1.0).

#### `setEnabled(enabled)`
Enable or disable all audio.

## Credits

When using audio resources, create an `audio/CREDITS.txt` file to attribute sources:

```
Background Music:
  battle.ogg - Composer Name - License

Sound Effects:
  goblin.wav - freesound.org/user/sound - License
```
