# Audio Assets

This directory contains audio assets for the game.

## Directory Structure

```
audio/
├── bgm/              # Background Music
│   └── battle.ogg    # Battle theme music
├── bgse/             # Background Sound Effects (Ambient)
│   ├── cave.ogg      # Cave ambience
│   ├── bubbling.ogg  # Water bubbling sounds
│   └── seagulls.ogg  # Seagull sounds
└── sfx/              # Sound Effects
    ├── attacks/      # Character attack sounds
    ├── skills/       # Skill sound effects
    └── monsters/     # Monster sound effects
```

## Audio Format Requirements

- **Background Music (bgm)**: OGG Vorbis format for better compression and looping
- **Background Sound Effects (bgse)**: OGG Vorbis format
- **Sound Effects (sfx)**: WAV format for quick loading, or OGG for smaller file size

## Finding Audio Assets

### Free Audio Resources

**Background Music:**
- [Incompetech](https://incompetech.com/) - Royalty-free music by Kevin MacLeod
- [OpenGameArt.org](https://opengameart.org/) - Community game assets including music
- [FreePD](https://freepd.com/) - Public domain music

**Sound Effects:**
- [Freesound.org](https://freesound.org/) - Community sound effects (various licenses)
- [ZapSplat](https://www.zapsplat.com/) - Free sound effects (free with attribution)
- [OpenGameArt.org](https://opengameart.org/) - Game sound effects

**Ambient Sounds:**
- [Freesound.org](https://freesound.org/) - Search for "ambient", "cave", "water", etc.
- [BBC Sound Effects](https://sound-effects.bbcrewind.co.uk/) - Free for personal/educational use

### Creating Your Own Audio

**Tools:**
- [Audacity](https://www.audacityteam.org/) - Free audio editor
- [LMMS](https://lmms.io/) - Free music production software
- [Bfxr](https://www.bfxr.net/) - 8-bit style sound effect generator
- [ChipTone](https://sfbgames.itch.io/chiptone) - Retro game sound effect maker

## Converting to OGG Format

Use [Audacity](https://www.audacityteam.org/) to convert audio files:

1. Open your audio file in Audacity
2. Go to File → Export → Export as OGG Vorbis
3. Choose quality setting (5-8 is good for most game audio)
4. Save to the appropriate folder

## File Naming Conventions

- Use lowercase with hyphens: `goblin-roar.wav`
- Character attacks: `character-name.wav` (e.g., `aisha.wav`)
- Skills: `skill-name.wav` (e.g., `fire-a.wav`, `heal.wav`)
- Monsters: `monster-name.wav` (e.g., `goblin.wav`, `spider.wav`)

## Attribution

**Important:** Always provide proper attribution for audio you didn't create yourself!

Create a `CREDITS.txt` file in this directory listing all audio sources:

```
AUDIO CREDITS

Background Music:
  battle.ogg - "Epic Battle Theme" by Composer Name
    License: Creative Commons Attribution 4.0
    Source: https://example.com/

Sound Effects:
  goblin.wav - "Goblin Growl" by Sound Designer
    License: CC0 (Public Domain)
    Source: https://freesound.org/s/12345/

Ambient Sounds:
  cave.ogg - "Cave Ambience" by Field Recorder
    License: Attribution 3.0
    Source: https://freesound.org/s/67890/
```

## Testing Audio

To test if your audio files work:

1. Start a local web server in the project root
2. Open the game in your browser
3. Navigate to a location with audio
4. Check the browser console for any audio loading errors
5. Adjust volume levels if needed (default: bgm=0.3, sfx=0.7)

## Performance Tips

- Keep background music files under 3MB
- Keep sound effects under 100KB each
- Use OGG format for files that will loop (better compression)
- Use WAV for short, frequently-played sound effects (faster loading)
- Consider using mono audio for sound effects (smaller file size)
