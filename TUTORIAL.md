# Creating Your First Game with Vivid

This guide will walk you through creating a simple game from scratch.

## Step 1: Create Game Folder

Create a new folder for your game:
```
vivid/
  engine/
  my_first_game/    <- Your new game
```

## Step 2: Create index.html

Create `my_first_game/index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My First Game</title>
    <link rel="stylesheet" href="../engine/styles.css">
</head>
<body>
    <div id="loading">
        <div class="loading-content">
            <div class="loading-spinner"></div>
            <h2 tabindex="0">Loading My First Game...</h2>
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

## Step 3: Create Game.json

Create `my_first_game/Game.json`:

```json
{
    "GameName": "My First Game",
    "StartingLocationId": "Locations/Home",
    "StartingParty": [
        {
            "Name": "You",
            "CurrentHealth": 100,
            "TotalHealth": 100
        }
    ]
}
```

## Step 4: Create Your First Location

Create `my_first_game/Locations/Home.json`:

```json
{
    "Name": "Your Home",
    "Description": "You are standing in your cozy home. There's a door to the outside.",
    "ImageUrl": "https://via.placeholder.com/800x400/2a2a2a/8b4513?text=Home",
    "LinkedLocations": [
        {
            "Id": "Locations/Outside",
            "Description": "Go outside"
        }
    ],
    "NPCs": [
        {
            "Name": "Your Cat",
            "Texts": ["Meow!", "Purr...", "Feed me!"]
        }
    ]
}
```

## Step 5: Create Another Location

Create `my_first_game/Locations/Outside.json`:

```json
{
    "Name": "Outside",
    "Description": "You step outside into the fresh air. The sun is shining, birds are singing.",
    "ImageUrl": "https://via.placeholder.com/800x400/87CEEB/228B22?text=Outside",
    "LinkedLocations": [
        {
            "Id": "Locations/Home",
            "Description": "Go back home"
        },
        {
            "Id": "Locations/Forest",
            "Description": "Explore the forest"
        }
    ]
}
```

## Step 6: Add More Content

Create `my_first_game/Locations/Forest.json`:

```json
{
    "Name": "The Forest",
    "Description": "Tall trees surround you. The path splits in two directions.",
    "ImageUrl": "https://via.placeholder.com/800x400/2F4F2F/8B4513?text=Forest",
    "LinkedLocations": [
        {
            "Id": "Locations/Outside",
            "Description": "Return to the village"
        }
    ],
    "NPCs": [
        {
            "Name": "Wise Old Owl",
            "Texts": [
                "Hoot! Welcome to the forest, traveler.",
                "Remember: not all who wander are lost.",
                "Come back anytime!"
            ],
            "OnTalk": {
                "$type": "TextBlade.Core.Game.Actions.SetSwitchAction, TextBlade.Core",
                "SwitchName": "MetOwl",
                "Value": true
            }
        }
    ]
}
```

## Step 7: Test Your Game

1. Open a terminal in the `vivid/` root directory
2. Run: `python -m http.server 8000`
3. Open: `http://localhost:8000/my_first_game/`

## Adding Advanced Features

### Conditional Locations

Add a switch requirement:

```json
{
    "Id": "Locations/SecretCave",
    "Description": "Enter the secret cave",
    "SwitchRequired": "MetOwl"
}
```

### Shops

```json
{
    "Name": "The Shop",
    "Description": "A small general store.",
    "Shop": {
        "ItemsForSale": [
            {
                "Name": "Health Potion",
                "Description": "Restores 50 HP",
                "Price": 25
            }
        ]
    },
    "LinkedLocations": [...]
}
```

### Inns

```json
{
    "Name": "The Inn",
    "Description": "A cozy place to rest.",
    "PricePerNight": 10,
    "LinkedLocations": [...]
}
```

## Customizing Styles

Create `my_first_game/custom-styles.css`:

```css
:root {
    /* Use your own colors! */
    --bg-primary: #0a0a0a;
    --accent-primary: #ff6b6b;
    --accent-secondary: #ee5a5a;
}

#location-name {
    font-family: 'Arial', sans-serif;
    font-size: 3rem;
}
```

Then add it to your HTML:
```html
<link rel="stylesheet" href="custom-styles.css">
```

## Tips

1. **Start Small**: Create 2-3 locations first, then expand
2. **Test Often**: Run your game after each location you add
3. **Use Placeholder Images**: Use placeholder.com for quick testing
4. **Validate JSON**: Use jsonlint.com to check your JSON files
5. **Be Consistent**: Use the same naming convention for all files

## Next Steps

- Add more locations and NPCs
- Create an interconnected world
- Add switches for quest progression
- Design your own visual theme
- Deploy to GitHub Pages!

Happy game creating! 🎮
