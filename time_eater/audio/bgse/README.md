# Background Sound Effects (Ambient)

Place looping ambient sound files here in OGG format:
- cave.ogg - Cave ambience with echoes
- bubbling.ogg - Water bubbling sounds
- seagulls.ogg - Seagull cries
- wind.ogg - Wind blowing
- fire.ogg - Crackling fire

Reference in location JSON:
```json
{
  "BackgroundAudio": "audio/bgse/seagulls.ogg"
}
```

Or layer multiple:
```json
{
  "BackgroundAudios": ["audio/bgse/cave.ogg", "audio/bgse/bubbling.ogg"]
}
```
