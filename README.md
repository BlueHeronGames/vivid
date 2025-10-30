# Vivid

A lightweight, accessible web-based game engine for creating choice-driven RPG adventures.

## What is Vivid?

Vivid (formerly TextBlade) is a game engine designed to make old-school adventure games accessible to both blind and sighted players. It features:

- 🎮 **Choice-Driven Gameplay**: Navigate locations, interact with NPCs, visit shops
- ♿ **Fully Accessible**: Complete keyboard navigation, screen reader friendly
- 🎨 **Visual + Text**: Beautiful dark fantasy UI with full text descriptions
- 🚀 **Easy to Use**: JSON-based game creation, no coding required
- 📱 **Cross-Platform**: Works on desktop and mobile browsers

## Projects

### Engine (`/engine/`)

The core TextBlade web engine. Reusable JavaScript game engine and default dark fantasy styling.

[Read the Engine Documentation](engine/README.md)

### Time Eater (`/time_eater/`)

A demo game built with the Vivid engine. Explore King's Vale, talk to NPCs, and embark on an adventure!

## Quick Start

1. Check out the `time_eater` folder for a complete game example
2. Read the [Engine README](engine/README.md) for how to create your own game
3. Deploy to GitHub Pages for instant web hosting

## Structure

```
vivid/
  engine/           - Core game engine (reusable)
    game-engine.js  - Game logic
    styles.css      - Default dark fantasy theme
    README.md       - Engine documentation
  
  time_eater/       - Demo game
    index.html      - Game entry point
    Game.json       - Game configuration
    Locations/      - Location data files
    custom-styles.css - Game-specific styling
```

## Creating Your Own Game

See the [Engine Documentation](engine/README.md) for a complete guide to creating your own game with Vivid.

## License

MIT License - free to use for your own projects!