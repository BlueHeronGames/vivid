/**
 * TextBlade Web Engine
 * A web-based game engine for choice-driven RPG adventures
 */

class GameEngine {
    constructor() {
        this.gameData = null;
        this.currentLocation = null;
        this.party = [];
        this.inventory = {};
        this.switches = {};
        this.visited = new Set();
        
        // UI Elements
        this.locationNameEl = null;
        this.locationImageEl = null;
        this.descriptionEl = null;
        this.choicesEl = null;
        this.loadingEl = null;
    }

    /**
     * Initialize the game engine
     * @param {string} gameDataPath - Path to the game data JSON file
     */
    async init(gameDataPath) {
        this.showLoading();
        
        try {
            // Load game data
            const response = await fetch(gameDataPath);
            if (!response.ok) {
                throw new Error(`Failed to load game data: ${response.statusText}`);
            }
            
            this.gameData = await response.json();
            
            // Load additional data files
            await this.loadDataFiles();
            
            // Initialize game state
            this.initializeGameState();
            
            // Setup UI
            this.setupUI();
            
            // Start at the starting location
            await this.goToLocation(this.gameData.StartingLocationId);
            
            this.hideLoading();
        } catch (error) {
            this.showError(`Failed to initialize game: ${error.message}`);
        }
    }

    /**
     * Load additional data files (items, monsters, skills, etc.)
     */
    async loadDataFiles() {
        // Store references to data files if they exist
        this.items = this.gameData.Items || {};
        this.monsters = this.gameData.Monsters || {};
        this.skills = this.gameData.Skills || {};
        this.statuses = this.gameData.Statuses || {};
    }

    /**
     * Initialize the game state from game data
     */
    initializeGameState() {
        if (this.gameData.StartingParty) {
            this.party = JSON.parse(JSON.stringify(this.gameData.StartingParty));
        }
    }

    /**
     * Setup UI elements
     */
    setupUI() {
        this.locationNameEl = document.getElementById('location-name');
        this.locationImageEl = document.getElementById('location-image');
        this.descriptionEl = document.getElementById('description');
        this.choicesEl = document.getElementById('choices');
        this.loadingEl = document.getElementById('loading');
    }

    /**
     * Navigate to a location
     * @param {string} locationId - The location ID to navigate to
     */
    async goToLocation(locationId) {
        try {
            // Load location data
            const locationPath = `${locationId}.json`;
            const response = await fetch(locationPath);
            
            if (!response.ok) {
                throw new Error(`Location not found: ${locationId}`);
            }
            
            this.currentLocation = await response.json();
            this.visited.add(locationId);
            
            // Render the location
            this.renderLocation();
            
        } catch (error) {
            this.showError(`Failed to load location: ${error.message}`);
        }
    }

    /**
     * Render the current location
     */
    renderLocation() {
        const location = this.currentLocation;
        
        // Update location name
        this.locationNameEl.textContent = location.Name || 'Unknown Location';
        
        // Update image
        if (location.ImageUrl) {
            this.locationImageEl.src = location.ImageUrl;
            this.locationImageEl.alt = location.Name;
            this.locationImageEl.style.display = 'block';
        } else {
            this.locationImageEl.style.display = 'none';
        }
        
        // Update description
        this.descriptionEl.textContent = location.Description || '';
        
        // Render choices
        this.renderChoices();
    }

    /**
     * Render choice buttons
     */
    renderChoices() {
        // Clear existing choices
        this.choicesEl.innerHTML = '';
        
        const choices = [];
        
        // Add location links
        if (this.currentLocation.LinkedLocations) {
            this.currentLocation.LinkedLocations.forEach(link => {
                // Check if switch required
                if (link.SwitchRequired && !this.switches[link.SwitchRequired]) {
                    return; // Skip this choice
                }
                
                choices.push({
                    text: link.Description || link.Id,
                    action: () => this.goToLocation(link.Id)
                });
            });
        }
        
        // Add NPC interactions
        if (this.currentLocation.NPCs) {
            this.currentLocation.NPCs.forEach((npc, index) => {
                choices.push({
                    text: `Talk to ${npc.Name}`,
                    action: () => this.talkToNPC(index)
                });
            });
        }
        
        // Add shop interaction
        if (this.currentLocation.Shop) {
            choices.push({
                text: 'Browse Shop',
                action: () => this.openShop()
            });
        }
        
        // Add inn interaction
        if (this.currentLocation.PricePerNight) {
            choices.push({
                text: `Rest at Inn (${this.currentLocation.PricePerNight} gold)`,
                action: () => this.restAtInn()
            });
        }
        
        // Render choice buttons
        choices.forEach((choice, index) => {
            const button = document.createElement('button');
            button.className = 'choice-button';
            button.textContent = choice.text;
            button.tabIndex = 0;
            button.onclick = choice.action;
            
            // Keyboard support
            button.onkeydown = (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    choice.action();
                }
            };
            
            this.choicesEl.appendChild(button);
        });
    }

    /**
     * Talk to an NPC
     * @param {number} npcIndex - Index of the NPC in the current location
     */
    talkToNPC(npcIndex) {
        const npc = this.currentLocation.NPCs[npcIndex];
        
        if (!npc) return;
        
        // Track how many times we've talked to this NPC
        const talkKey = `talked_${this.currentLocation.Name}_${npc.Name}`;
        const talkCount = this.switches[talkKey] || 0;
        
        // Get the appropriate text
        let text = '';
        if (Array.isArray(npc.Texts)) {
            const textIndex = Math.min(talkCount, npc.Texts.length - 1);
            text = npc.Texts[textIndex];
        } else if (npc.Text) {
            text = npc.Text;
        }
        
        // Show dialog
        this.showDialog(npc.Name, text);
        
        // Increment talk counter
        this.switches[talkKey] = talkCount + 1;
        
        // Execute OnTalk action
        if (npc.OnTalk) {
            this.executeAction(npc.OnTalk);
        }
    }

    /**
     * Execute a game action
     * @param {object} action - The action to execute
     */
    executeAction(action) {
        if (!action || !action.$type) return;
        
        const actionType = action.$type.split(',')[0].split('.').pop();
        
        switch (actionType) {
            case 'SetSwitchAction':
                this.switches[action.SwitchName] = action.Value;
                break;
            case 'GiveItemAction':
                this.addToInventory(action.ItemName, action.Quantity || 1);
                break;
            // Add more action types as needed
        }
    }

    /**
     * Add item to inventory
     * @param {string} itemName - Name of the item
     * @param {number} quantity - Quantity to add
     */
    addToInventory(itemName, quantity = 1) {
        this.inventory[itemName] = (this.inventory[itemName] || 0) + quantity;
    }

    /**
     * Show a dialog box
     * @param {string} title - Dialog title
     * @param {string} text - Dialog text
     */
    showDialog(title, text) {
        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.className = 'dialog-overlay';
        overlay.tabIndex = 0;
        
        const dialog = document.createElement('div');
        dialog.className = 'dialog';
        dialog.setAttribute('role', 'dialog');
        dialog.setAttribute('aria-labelledby', 'dialog-title');
        
        const dialogTitle = document.createElement('h2');
        dialogTitle.id = 'dialog-title';
        dialogTitle.textContent = title;
        dialogTitle.tabIndex = 0;
        
        const dialogText = document.createElement('p');
        dialogText.textContent = text;
        dialogText.tabIndex = 0;
        
        const closeButton = document.createElement('button');
        closeButton.textContent = 'Close';
        closeButton.className = 'dialog-close';
        closeButton.tabIndex = 0;
        closeButton.onclick = () => {
            document.body.removeChild(overlay);
        };
        
        closeButton.onkeydown = (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                document.body.removeChild(overlay);
            }
        };
        
        dialog.appendChild(dialogTitle);
        dialog.appendChild(dialogText);
        dialog.appendChild(closeButton);
        overlay.appendChild(dialog);
        
        document.body.appendChild(overlay);
        
        // Focus on close button
        setTimeout(() => closeButton.focus(), 100);
    }

    /**
     * Open shop interface
     */
    openShop() {
        const shop = this.currentLocation.Shop;
        if (!shop) return;
        
        // For now, just show available items
        const items = shop.ItemsForSale || [];
        const itemList = items.map(item => `${item.Name} - ${item.Price || '??'} gold`).join('\n');
        
        this.showDialog('Shop', itemList || 'No items available.');
    }

    /**
     * Rest at inn
     */
    restAtInn() {
        const price = this.currentLocation.PricePerNight || 0;
        
        // Heal party (simplified for now)
        this.party.forEach(member => {
            member.CurrentHealth = member.TotalHealth;
            member.CurrentSkillPoints = member.TotalSkillPoints;
        });
        
        this.showDialog('Inn', `You rested at the inn and fully recovered! (-${price} gold)`);
    }

    /**
     * Show loading screen
     */
    showLoading() {
        if (this.loadingEl) {
            this.loadingEl.style.display = 'flex';
        }
    }

    /**
     * Hide loading screen
     */
    hideLoading() {
        if (this.loadingEl) {
            this.loadingEl.style.display = 'none';
        }
    }

    /**
     * Show error message
     * @param {string} message - Error message to display
     */
    showError(message) {
        console.error(message);
        
        if (this.loadingEl) {
            this.loadingEl.innerHTML = `
                <div class="error">
                    <h2 tabindex="0">Error</h2>
                    <p tabindex="0">${message}</p>
                </div>
            `;
            this.loadingEl.style.display = 'flex';
        }
    }
}

// Export for use in game files
window.GameEngine = GameEngine;
