# TextBlade Web Engine

A lightweight, accessible web-based game engine for creating choice-driven RPG adventures.

## Features

- 🎮 **Choice-Driven Gameplay**: Navigate through locations, talk to NPCs, visit shops, and make decisions
- ♿ **Fully Accessible**: Keyboard navigation with proper tab indices on all interactive elements
- 🎨 **Customizable**: Minimal dark fantasy theme that can be easily overridden
- 📱 **Responsive**: Works on desktop and mobile devices
- 🚀 **Easy to Deploy**: Static files perfect for GitHub Pages

## Quick Start

### Creating a New Game

1. Create a new folder for your game (e.g., `my_game/`)
2. Create an `index.html` that loads the engine:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Game</title>
    <link rel="stylesheet" href="../engine/styles.css">
    <link rel="stylesheet" href="custom-styles.css">
</head>
<body>
    <div id="loading">
        <div class="loading-content">
            <div class="loading-spinner"></div>
            <h2 tabindex="0">Loading...</h2>
        </div>
    </div>

    <div id="game-container">
        <div class="game-vbox">
            <h1 id="location-name" tabindex="0">Loading...</h1>
            <div id="location-image-container">
                <img id="location-image" src="" alt="" tabindex="0">
            </div>
            <div id="description-container">
                <p id="description" tabindex="0">Loading...</p>
            </div>
            <div id="choices-container">
                <div id="choices" role="group" aria-label="Available actions"></div>
            </div>
        </div>
    </div>

    <script src="../engine/game-engine.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const engine = new GameEngine();
            engine.init('Game.json');
        });
    </script>
</body>
</html>
```

3. Create a `Game.json` file with your game configuration:

```json
{
    "GameName": "My Game",
    "StartingLocationId": "Locations/StartLocation",
    "StartingParty": [
        {
            "Name": "Hero",
            "CurrentHealth": 100,
            "TotalHealth": 100
        }
    ]
}
```

4. Create location JSON files (e.g., `Locations/StartLocation.json`):

```json
{
    "Name": "Starting Location",
    "Description": "You find yourself in a mysterious place...",
    "ImageUrl": "path/to/image.jpg",
    "LinkedLocations": [
        {
            "Id": "Locations/NextLocation",
            "Description": "Go forward"
        }
    ],
    "NPCs": [
        {
            "Name": "Friendly NPC",
            "Texts": ["Hello, traveler!"]
        }
    ]
}
```

## Location JSON Format

### Basic Structure

```json
{
    "Name": "Location Name",
    "Description": "Location description text",
    "ImageUrl": "https://example.com/image.jpg",
    "BackgroundAudio": "audio/background.mp3",
    "LinkedLocations": [...],
    "NPCs": [...],
    "Shop": {...},
    "PricePerNight": 10
}
```

### Linked Locations

```json
"LinkedLocations": [
    {
        "Id": "Locations/OtherLocation",
        "Description": "Go to other location",
        "SwitchRequired": "HasKey"
    }
]
```

Locations can require switches (game flags) to be available.

### NPCs

```json
"NPCs": [
    {
        "Name": "NPC Name",
        "Texts": [
            "First thing they say",
            "Second thing (on repeat interaction)",
            "Third thing..."
        ],
        "OnTalk": {
            "$type": "TextBlade.Core.Game.Actions.SetSwitchAction, TextBlade.Core",
            "SwitchName": "TalkedToNPC",
            "Value": true
        }
    }
]
```

NPCs can have multiple dialogue lines that cycle through on repeated interactions.

### Shops

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

### Inns

Set `PricePerNight` to make a location function as an inn:

```json
{
    "Name": "The Inn",
    "Description": "A cozy place to rest",
    "PricePerNight": 10
}
```

## Customization

### Custom Styles

Create a `custom-styles.css` file to override the default theme:

```css
:root {
    --bg-primary: #yourcolor;
    --accent-primary: #yourcolor;
}
```

Available CSS variables:
- `--bg-primary`: Main background color
- `--bg-secondary`: Secondary background color
- `--bg-tertiary`: Tertiary background color
- `--text-primary`: Primary text color
- `--text-secondary`: Secondary text color
- `--accent-primary`: Primary accent color
- `--accent-secondary`: Secondary accent color
- `--border-color`: Border color
- `--shadow`: Shadow color
- `--button-hover`: Button hover color

## Layout

The game uses a VBox (vertical box) layout:

1. **Location Name** - Large heading at the top
2. **Location Image** - Visual representation of the location
3. **Description** - Text description of the scene
4. **Choices Grid** - 5×3 grid of action buttons (responsive)

## Accessibility

- All text elements have `tabindex="0"` for keyboard navigation
- Buttons support Enter and Space key activation
- Semantic HTML with proper ARIA labels
- Focus indicators on all interactive elements
- Screen reader friendly

## Deployment

### GitHub Pages

1. Push your code to a GitHub repository
2. Go to Settings → Pages
3. Select your branch (usually `main`)
4. Your game will be available at `https://yourusername.github.io/yourrepo/`

## Browser Support

Works in all modern browsers:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## License

MIT License - feel free to use for your own projects!
