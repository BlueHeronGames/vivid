# Quick Reference Guide

## Location JSON Structure

```json
{
    "Name": "Location Name",
    "Description": "Text description",
    "ImageUrl": "path/to/image.jpg",
    "BackgroundAudio": "path/to/audio.mp3",
    "LinkedLocations": [...],
    "NPCs": [...],
    "Shop": {...},
    "PricePerNight": 10
}
```

## Linked Locations

```json
"LinkedLocations": [
    {
        "Id": "Locations/Path/To/Location",
        "Description": "Button text",
        "SwitchRequired": "OptionalSwitchName"
    }
]
```

## NPCs

### Simple NPC
```json
{
    "Name": "NPC Name",
    "Texts": ["Single line of dialogue"]
}
```

### Multi-Line Dialogue
```json
{
    "Name": "NPC Name",
    "Texts": [
        "First conversation",
        "Second conversation",
        "Third conversation"
    ]
}
```

### NPC with Action
```json
{
    "Name": "Quest Giver",
    "Texts": ["Accept my quest!"],
    "OnTalk": {
        "$type": "TextBlade.Core.Game.Actions.SetSwitchAction, TextBlade.Core",
        "SwitchName": "QuestStarted",
        "Value": true
    }
}
```

## Shops

```json
"Shop": {
    "ItemsForSale": [
        {
            "Name": "Item Name",
            "Description": "Item description",
            "Price": 100
        }
    ]
}
```

## Inns

```json
{
    "Name": "The Inn",
    "Description": "A place to rest",
    "PricePerNight": 10,
    "LinkedLocations": [...]
}
```

## Game.json

```json
{
    "GameName": "Your Game Name",
    "StartingLocationId": "Locations/StartLocation",
    "StartingParty": [
        {
            "Name": "Character Name",
            "CurrentHealth": 100,
            "TotalHealth": 100,
            "CurrentSkillPoints": 50,
            "TotalSkillPoints": 50,
            "Strength": 10,
            "Toughness": 10,
            "Special": 10,
            "SpecialDefense": 10,
            "Skills": ["Skill1", "Skill2"]
        }
    ]
}
```

## CSS Variables

```css
:root {
    --bg-primary: #1a1a1a;
    --bg-secondary: #2a2a2a;
    --bg-tertiary: #3a3a3a;
    --text-primary: #e0e0e0;
    --text-secondary: #b0b0b0;
    --accent-primary: #8b4513;
    --accent-secondary: #a0522d;
    --border-color: #4a4a4a;
    --shadow: rgba(0, 0, 0, 0.5);
    --button-hover: #4a3020;
}
```

## File Structure

```
your_game/
├── index.html
├── Game.json
├── custom-styles.css (optional)
└── Locations/
    ├── Area1/
    │   ├── Location1.json
    │   └── Location2.json
    └── Area2/
        └── Location3.json
```

## Common Patterns

### Quest Progression

1. NPC gives quest, sets switch:
```json
"OnTalk": {
    "$type": "TextBlade.Core.Game.Actions.SetSwitchAction, TextBlade.Core",
    "SwitchName": "QuestActive",
    "Value": true
}
```

2. New location becomes available:
```json
{
    "Id": "Locations/QuestDestination",
    "Description": "Go to quest location",
    "SwitchRequired": "QuestActive"
}
```

### Multiple Shops in One Location

Not directly supported. Create separate shop locations instead.

### Item Requirements

Use switches to track item possession:
```json
"SwitchRequired": "HasKey"
```

## Placeholder Images

Use placeholder.com for quick testing:
```
https://via.placeholder.com/800x400/BGCOLOR/TEXTCOLOR?text=Your+Text
```

Examples:
- Dark background: `/2a2a2a/8b4513?text=Location+Name`
- Light background: `/87CEEB/228B22?text=Outdoor+Scene`
- Forest: `/2F4F2F/8B4513?text=Forest`

## Troubleshooting

### Location Won't Load
- Check file path matches `Id` exactly
- Verify JSON is valid (use jsonlint.com)
- Check console for errors (F12)

### Buttons Don't Show
- Verify `LinkedLocations` array syntax
- Check for required switches
- Ensure location files exist

### Images Don't Show
- Use full URLs for external images
- Check relative paths are correct
- Verify `ImageUrl` field name

### Styling Not Applied
- Check CSS file is linked in HTML
- Verify CSS variable names
- Clear browser cache

## Testing Checklist

- [ ] All locations load correctly
- [ ] All NPCs have dialogue
- [ ] All linked locations work
- [ ] Images display properly
- [ ] Keyboard navigation works
- [ ] Responsive on mobile
- [ ] No console errors
- [ ] All switches work as expected

## Performance Tips

- Keep location files small (< 50KB)
- Optimize images (< 500KB each)
- Limit to 15 buttons per location
- Use lazy loading for large games

## Best Practices

1. **Naming**: Use PascalCase for location folders
2. **Organization**: Group locations by area
3. **Consistency**: Keep similar locations similar
4. **Testing**: Test each location as you create it
5. **Documentation**: Comment your custom CSS
6. **Accessibility**: Test with keyboard only
7. **Images**: Always provide alt text in ImageUrl
8. **Dialogue**: Keep NPC text concise
9. **Buttons**: Use clear, action-oriented text
10. **Switches**: Use descriptive names

Happy game creating! 🎮
