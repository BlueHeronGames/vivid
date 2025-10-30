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
        this.equipment = {}; // Track equipped items per character
        this.switches = {};
        this.visited = new Set();
        this.gold = 0;
        this.experience = 0;
        
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
        
        // Initialize starting gold
        this.gold = this.gameData.StartingGold || 100;
        
        // Initialize equipment slots for each character
        this.party.forEach(member => {
            this.equipment[member.Name] = {
                Weapon: null,
                Helmet: null,
                Armour: null
            };
        });
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
        this.goldAmountEl = document.getElementById('gold-amount');
        
        // Setup status bar buttons
        const partyButton = document.getElementById('party-button');
        const inventoryButton = document.getElementById('inventory-button');
        
        if (partyButton) {
            partyButton.onclick = () => this.showPartyScreen();
            partyButton.onkeydown = (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.showPartyScreen();
                }
            };
        }
        
        if (inventoryButton) {
            inventoryButton.onclick = () => this.showInventoryScreen();
            inventoryButton.onkeydown = (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.showInventoryScreen();
                }
            };
        }
        
        // Update gold display
        this.updateGoldDisplay();
    }

    /**
     * Update the gold display in the UI
     */
    updateGoldDisplay() {
        if (this.goldAmountEl) {
            this.goldAmountEl.textContent = this.gold;
        }
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
        
        // Check if this is a dungeon location
        if (this.currentLocation.IsDungeon) {
            choices.push({
                text: 'Enter Dungeon',
                action: () => this.enterDungeon()
            });
        }
        
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

        // Re-render choices in case conversation unlocked new options
        this.renderChoices();
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
        
        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.className = 'dialog-overlay';
        overlay.tabIndex = 0;
        
        const shopDialog = document.createElement('div');
        shopDialog.className = 'dialog shop-dialog';
        shopDialog.setAttribute('role', 'dialog');
        shopDialog.setAttribute('aria-labelledby', 'shop-title');
        
        const shopTitle = document.createElement('h2');
        shopTitle.id = 'shop-title';
        shopTitle.textContent = 'Shop';
        shopTitle.tabIndex = 0;
        
        const goldDisplay = document.createElement('p');
        goldDisplay.className = 'gold-display';
        goldDisplay.textContent = `Your Gold: ${this.gold}`;
        goldDisplay.tabIndex = 0;
        
        const itemsContainer = document.createElement('div');
        itemsContainer.className = 'shop-items';
        
        const items = shop.ItemsForSale || [];
        
        if (items.length === 0) {
            const emptyMsg = document.createElement('p');
            emptyMsg.textContent = 'No items available.';
            emptyMsg.tabIndex = 0;
            itemsContainer.appendChild(emptyMsg);
        } else {
            items.forEach(item => {
                const itemRow = document.createElement('div');
                itemRow.className = 'shop-item';
                
                const itemInfo = document.createElement('div');
                itemInfo.className = 'shop-item-info';
                
                const itemName = document.createElement('span');
                itemName.className = 'shop-item-name';
                itemName.textContent = item.Name;
                itemName.tabIndex = 0;
                
                const itemDesc = document.createElement('span');
                itemDesc.className = 'shop-item-desc';
                itemDesc.textContent = item.Description || '';
                itemDesc.tabIndex = 0;
                
                const itemPrice = document.createElement('span');
                itemPrice.className = 'shop-item-price';
                itemPrice.textContent = `${item.Price || 0} gold`;
                itemPrice.tabIndex = 0;
                
                itemInfo.appendChild(itemName);
                if (item.Description) {
                    itemInfo.appendChild(itemDesc);
                }
                itemInfo.appendChild(itemPrice);
                
                const buyButton = document.createElement('button');
                buyButton.className = 'shop-buy-button';
                buyButton.textContent = 'Buy';
                buyButton.tabIndex = 0;
                
                const canAfford = this.gold >= (item.Price || 0);
                if (!canAfford) {
                    buyButton.disabled = true;
                    buyButton.classList.add('disabled');
                }
                
                buyButton.onclick = () => {
                    if (this.buyItem(item)) {
                        // Update gold display
                        goldDisplay.textContent = `Your Gold: ${this.gold}`;
                        
                        // Update all buy buttons' enabled state
                        const allBuyButtons = shopDialog.querySelectorAll('.shop-buy-button');
                        allBuyButtons.forEach(btn => {
                            const btnItem = items.find(i => btn.parentElement.querySelector('.shop-item-name').textContent === i.Name);
                            if (btnItem && this.gold < btnItem.Price) {
                                btn.disabled = true;
                                btn.classList.add('disabled');
                            }
                        });
                        
                        this.showQuickMessage(`Bought ${item.Name}!`);
                    }
                };
                
                buyButton.onkeydown = (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        buyButton.click();
                    }
                };
                
                itemRow.appendChild(itemInfo);
                itemRow.appendChild(buyButton);
                itemsContainer.appendChild(itemRow);
            });
        }
        
        const closeButton = document.createElement('button');
        closeButton.textContent = 'Leave Shop';
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
        
        shopDialog.appendChild(shopTitle);
        shopDialog.appendChild(goldDisplay);
        shopDialog.appendChild(itemsContainer);
        shopDialog.appendChild(closeButton);
        overlay.appendChild(shopDialog);
        
        document.body.appendChild(overlay);
        
        setTimeout(() => {
            const firstButton = shopDialog.querySelector('.shop-buy-button:not(.disabled)');
            if (firstButton) {
                firstButton.focus();
            } else {
                closeButton.focus();
            }
        }, 100);
    }

    /**
     * Buy an item from a shop
     * @param {object} item - The item to buy
     * @returns {boolean} - Whether the purchase was successful
     */
    buyItem(item) {
        const price = item.Price || 0;
        
        if (this.gold < price) {
            return false;
        }
        
        this.gold -= price;
        this.addToInventory(item.Name, 1);
        this.updateGoldDisplay();
        
        return true;
    }

    /**
     * Show a quick temporary message
     * @param {string} message - Message to display
     */
    showQuickMessage(message) {
        const msgEl = document.createElement('div');
        msgEl.className = 'quick-message';
        msgEl.textContent = message;
        msgEl.tabIndex = 0;
        
        document.body.appendChild(msgEl);
        
        setTimeout(() => msgEl.focus(), 10);
        
        setTimeout(() => {
            msgEl.classList.add('fade-out');
            setTimeout(() => {
                if (msgEl.parentNode) {
                    document.body.removeChild(msgEl);
                }
            }, 500);
        }, 2000);
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

    /**
     * Show inventory screen
     */
    showInventoryScreen() {
        const overlay = document.createElement('div');
        overlay.className = 'dialog-overlay';
        overlay.tabIndex = 0;
        
        const dialog = document.createElement('div');
        dialog.className = 'dialog inventory-dialog';
        dialog.setAttribute('role', 'dialog');
        dialog.setAttribute('aria-labelledby', 'inventory-title');
        
        const title = document.createElement('h2');
        title.id = 'inventory-title';
        title.textContent = 'Inventory';
        title.tabIndex = 0;
        
        const itemsContainer = document.createElement('div');
        itemsContainer.className = 'inventory-items';
        
        const inventoryKeys = Object.keys(this.inventory);
        
        if (inventoryKeys.length === 0) {
            const emptyMsg = document.createElement('p');
            emptyMsg.textContent = 'Your inventory is empty.';
            emptyMsg.tabIndex = 0;
            itemsContainer.appendChild(emptyMsg);
        } else {
            inventoryKeys.forEach(itemName => {
                const quantity = this.inventory[itemName];
                
                const itemRow = document.createElement('div');
                itemRow.className = 'inventory-item';
                
                const itemNameEl = document.createElement('span');
                itemNameEl.className = 'inventory-item-name';
                itemNameEl.textContent = itemName;
                itemNameEl.tabIndex = 0;
                
                const itemQty = document.createElement('span');
                itemQty.className = 'inventory-item-qty';
                itemQty.textContent = `x${quantity}`;
                itemQty.tabIndex = 0;
                
                itemRow.appendChild(itemNameEl);
                itemRow.appendChild(itemQty);
                itemsContainer.appendChild(itemRow);
            });
        }
        
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
        
        dialog.appendChild(title);
        dialog.appendChild(itemsContainer);
        dialog.appendChild(closeButton);
        overlay.appendChild(dialog);
        
        document.body.appendChild(overlay);
        
        setTimeout(() => closeButton.focus(), 100);
    }

    /**
     * Show party screen
     */
    showPartyScreen() {
        const overlay = document.createElement('div');
        overlay.className = 'dialog-overlay';
        overlay.tabIndex = 0;
        
        const dialog = document.createElement('div');
        dialog.className = 'dialog party-dialog';
        dialog.setAttribute('role', 'dialog');
        dialog.setAttribute('aria-labelledby', 'party-title');
        
        const title = document.createElement('h2');
        title.id = 'party-title';
        title.textContent = 'Party';
        title.tabIndex = 0;
        
        const partyContainer = document.createElement('div');
        partyContainer.className = 'party-members';
        
        this.party.forEach(member => {
            const memberCard = document.createElement('div');
            memberCard.className = 'party-member-card';
            
            const memberName = document.createElement('h3');
            memberName.textContent = member.Name;
            memberName.tabIndex = 0;
            
            const stats = document.createElement('div');
            stats.className = 'party-stats';
            
            const hpStat = document.createElement('div');
            hpStat.className = 'stat-row';
            hpStat.innerHTML = `<span tabindex="0">HP:</span> <span class="stat-value" tabindex="0">${member.CurrentHealth || 0} / ${member.TotalHealth || 0}</span>`;
            
            const spStat = document.createElement('div');
            spStat.className = 'stat-row';
            spStat.innerHTML = `<span tabindex="0">SP:</span> <span class="stat-value" tabindex="0">${member.CurrentSkillPoints || 0} / ${member.TotalSkillPoints || 0}</span>`;
            
            const strStat = document.createElement('div');
            strStat.className = 'stat-row';
            strStat.innerHTML = `<span tabindex="0">Strength:</span> <span class="stat-value" tabindex="0">${member.Strength || 0}</span>`;
            
            const toughStat = document.createElement('div');
            toughStat.className = 'stat-row';
            toughStat.innerHTML = `<span tabindex="0">Toughness:</span> <span class="stat-value" tabindex="0">${member.Toughness || 0}</span>`;
            
            const specStat = document.createElement('div');
            specStat.className = 'stat-row';
            specStat.innerHTML = `<span tabindex="0">Special:</span> <span class="stat-value" tabindex="0">${member.Special || 0}</span>`;
            
            const specDefStat = document.createElement('div');
            specDefStat.className = 'stat-row';
            specDefStat.innerHTML = `<span tabindex="0">Special Defense:</span> <span class="stat-value" tabindex="0">${member.SpecialDefense || 0}</span>`;
            
            stats.appendChild(hpStat);
            stats.appendChild(spStat);
            stats.appendChild(strStat);
            stats.appendChild(toughStat);
            stats.appendChild(specStat);
            stats.appendChild(specDefStat);
            
            // Show skills if available
            if (member.Skills && member.Skills.length > 0) {
                const skillsTitle = document.createElement('h4');
                skillsTitle.textContent = 'Skills:';
                skillsTitle.tabIndex = 0;
                
                const skillsList = document.createElement('div');
                skillsList.className = 'skills-list';
                
                member.Skills.forEach(skill => {
                    const skillEl = document.createElement('span');
                    skillEl.className = 'skill-badge';
                    skillEl.textContent = skill;
                    skillEl.tabIndex = 0;
                    skillsList.appendChild(skillEl);
                });
                
                stats.appendChild(skillsTitle);
                stats.appendChild(skillsList);
            }
            
            memberCard.appendChild(memberName);
            memberCard.appendChild(stats);
            partyContainer.appendChild(memberCard);
        });
        
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
        
        dialog.appendChild(title);
        dialog.appendChild(partyContainer);
        dialog.appendChild(closeButton);
        overlay.appendChild(dialog);
        
        document.body.appendChild(overlay);
        
        setTimeout(() => closeButton.focus(), 100);
    }

    /**
     * Enter a dungeon
     */
    enterDungeon() {
        const dungeon = this.currentLocation;
        
        // Initialize dungeon state
        this.dungeonState = {
            currentFloor: 1,
            numFloors: dungeon.NumFloors || 5,
            monsters: dungeon.Monsters || [],
            name: dungeon.Name
        };
        
        this.showDungeonFloor();
    }

    /**
     * Show the current dungeon floor
     */
    showDungeonFloor() {
        // Clear main UI
        this.locationNameEl.textContent = `${this.dungeonState.name} - Floor ${this.dungeonState.currentFloor}`;
        this.locationImageEl.style.display = 'none';
        this.descriptionEl.textContent = `You are on floor ${this.dungeonState.currentFloor} of ${this.dungeonState.numFloors}. What will you do?`;
        
        this.choicesEl.innerHTML = '';
        
        const exploreButton = document.createElement('button');
        exploreButton.className = 'choice-button';
        exploreButton.textContent = 'Explore Further';
        exploreButton.tabIndex = 0;
        exploreButton.onclick = () => this.dungeonExplore();
        exploreButton.onkeydown = (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.dungeonExplore();
            }
        };
        
        const leaveButton = document.createElement('button');
        leaveButton.className = 'choice-button';
        leaveButton.textContent = 'Leave Dungeon';
        leaveButton.tabIndex = 0;
        leaveButton.onclick = () => {
            this.dungeonState = null;
            this.renderLocation();
        };
        leaveButton.onkeydown = (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.dungeonState = null;
                this.renderLocation();
            }
        };
        
        this.choicesEl.appendChild(exploreButton);
        this.choicesEl.appendChild(leaveButton);
    }

    /**
     * Explore in the dungeon
     */
    dungeonExplore() {
        // Random encounter chance: 70%
        if (Math.random() < 0.7) {
            // Start combat
            const monsterName = this.dungeonState.monsters[Math.floor(Math.random() * this.dungeonState.monsters.length)];
            this.startCombat(monsterName);
        } else {
            // No encounter, advance floor
            this.dungeonState.currentFloor++;
            
            if (this.dungeonState.currentFloor > this.dungeonState.numFloors) {
                this.dungeonComplete();
            } else {
                this.showQuickMessage('Nothing here... moving forward.');
                setTimeout(() => this.showDungeonFloor(), 1500);
            }
        }
    }

    /**
     * Dungeon completed
     */
    dungeonComplete() {
        this.showDialog('Dungeon Complete!', `You've cleared all ${this.dungeonState.numFloors} floors!`);
        this.dungeonState = null;
        setTimeout(() => this.renderLocation(), 2000);
    }

    /**
     * Start combat with a monster
     * @param {string} monsterName - Name of the monster to fight
     */
    startCombat(monsterName) {
        const monsterTemplate = this.gameData.Monsters[monsterName];
        if (!monsterTemplate) {
            this.showError(`Monster not found: ${monsterName}`);
            return;
        }
        
        // Create monster instance
        this.currentCombat = {
            monster: {
                Name: monsterName,
                CurrentHealth: monsterTemplate.Health,
                TotalHealth: monsterTemplate.Health,
                Strength: monsterTemplate.Strength || 10,
                Toughness: monsterTemplate.Toughness || 5,
                Skills: monsterTemplate.Skills || [],
                Weakness: monsterTemplate.Weakness,
                Gold: monsterTemplate.Gold || 0,
                ExperiencePoints: monsterTemplate.ExperiencePoints || 0
            },
            turn: 'player',
            log: []
        };
        
        this.renderCombat();
    }

    /**
     * Render the combat screen
     */
    renderCombat() {
        const combat = this.currentCombat;
        const monster = combat.monster;
        
        this.locationNameEl.textContent = `Battle: ${monster.Name}`;
        this.locationImageEl.style.display = 'none';
        
        // Show combat status
        this.descriptionEl.innerHTML = `
            <div class="combat-status">
                <div class="monster-status" tabindex="0">
                    <strong>${monster.Name}</strong><br>
                    HP: ${monster.CurrentHealth} / ${monster.TotalHealth}
                </div>
                <div class="party-status-compact" tabindex="0">
                    ${this.party.map(m => `<div><strong>${m.Name}</strong>: ${m.CurrentHealth}/${m.TotalHealth} HP, ${m.CurrentSkillPoints}/${m.TotalSkillPoints} SP</div>`).join('')}
                </div>
            </div>
        `;
        
        // Show action buttons
        this.choicesEl.innerHTML = '';
        
        if (combat.turn === 'player') {
            // Player actions
            this.party.forEach((member, index) => {
                if (member.CurrentHealth > 0) {
                    const attackButton = this.createButton(`${member.Name}: Attack`, () => this.combatAttack(index));
                    this.choicesEl.appendChild(attackButton);
                    
                    // Add skill buttons
                    if (member.Skills) {
                        member.Skills.forEach(skillName => {
                            const skill = this.gameData.Skills[skillName];
                            if (skill && member.CurrentSkillPoints >= skill.Cost) {
                                const skillButton = this.createButton(`${member.Name}: ${skillName} (${skill.Cost} SP)`, () => this.combatUseSkill(index, skillName));
                                this.choicesEl.appendChild(skillButton);
                            }
                        });
                    }
                }
            });
        }
    }

    /**
     * Create a choice button
     */
    createButton(text, action) {
        const button = document.createElement('button');
        button.className = 'choice-button';
        button.textContent = text;
        button.tabIndex = 0;
        button.onclick = action;
        button.onkeydown = (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                action();
            }
        };
        return button;
    }

    /**
     * Player attacks monster
     */
    combatAttack(memberIndex) {
        const member = this.party[memberIndex];
        const monster = this.currentCombat.monster;
        
        const damage = Math.max(1, member.Strength - monster.Toughness);
        monster.CurrentHealth -= damage;
        
        this.showQuickMessage(`${member.Name} attacks for ${damage} damage!`);
        
        setTimeout(() => this.checkCombatEnd(), 1000);
    }

    /**
     * Player uses a skill
     */
    combatUseSkill(memberIndex, skillName) {
        const member = this.party[memberIndex];
        const skill = this.gameData.Skills[skillName];
        const monster = this.currentCombat.monster;
        
        if (member.CurrentSkillPoints < skill.Cost) {
            this.showQuickMessage('Not enough SP!');
            return;
        }
        
        member.CurrentSkillPoints -= skill.Cost;
        
        // Handle different skill targets
        if (skill.Target === 'SingleFriend') {
            // Heal skill
            const healAmount = Math.floor(member.Special * skill.DamageMultiplier);
            member.CurrentHealth = Math.min(member.TotalHealth, member.CurrentHealth + healAmount);
            this.showQuickMessage(`${member.Name} uses ${skillName} and heals ${healAmount} HP!`);
        } else {
            // Damage skill
            let damage = Math.floor((member.Strength + member.Special) * skill.DamageMultiplier);
            
            // Check weakness
            if (skill.DamageType === monster.Weakness) {
                damage = Math.floor(damage * 1.5);
                this.showQuickMessage(`It's super effective!`);
            }
            
            damage = Math.max(1, damage - monster.Toughness);
            monster.CurrentHealth -= damage;
            
            this.showQuickMessage(`${member.Name} uses ${skillName} for ${damage} damage!`);
        }
        
        setTimeout(() => this.checkCombatEnd(), 1500);
    }

    /**
     * Check if combat has ended
     */
    checkCombatEnd() {
        const monster = this.currentCombat.monster;
        
        // Check if monster is defeated
        if (monster.CurrentHealth <= 0) {
            this.combatVictory();
            return;
        }
        
        // Check if party is defeated
        const aliveMembers = this.party.filter(m => m.CurrentHealth > 0);
        if (aliveMembers.length === 0) {
            this.combatDefeat();
            return;
        }
        
        // Monster's turn
        this.currentCombat.turn = 'monster';
        setTimeout(() => this.monsterTurn(), 1000);
    }

    /**
     * Monster takes its turn
     */
    monsterTurn() {
        const monster = this.currentCombat.monster;
        const aliveMembers = this.party.filter(m => m.CurrentHealth > 0);
        const target = aliveMembers[Math.floor(Math.random() * aliveMembers.length)];
        
        const damage = Math.max(1, monster.Strength - target.Toughness);
        target.CurrentHealth -= damage;
        
        this.showQuickMessage(`${monster.Name} attacks ${target.Name} for ${damage} damage!`);
        
        setTimeout(() => {
            // Check if party is defeated
            const stillAlive = this.party.filter(m => m.CurrentHealth > 0);
            if (stillAlive.length === 0) {
                this.combatDefeat();
            } else {
                this.currentCombat.turn = 'player';
                this.renderCombat();
            }
        }, 1500);
    }

    /**
     * Combat victory
     */
    combatVictory() {
        const monster = this.currentCombat.monster;
        
        this.gold += monster.Gold;
        this.experience += monster.ExperiencePoints;
        this.updateGoldDisplay();
        
        this.showDialog('Victory!', `You defeated ${monster.Name}!\n\nGained ${monster.Gold} gold and ${monster.ExperiencePoints} XP.`);
        
        this.currentCombat = null;
        
        // Advance floor
        setTimeout(() => {
            this.dungeonState.currentFloor++;
            if (this.dungeonState.currentFloor > this.dungeonState.numFloors) {
                this.dungeonComplete();
            } else {
                this.showDungeonFloor();
            }
        }, 2500);
    }

    /**
     * Combat defeat
     */
    combatDefeat() {
        this.showDialog('Defeat...', 'Your party has been defeated. You retreat from the dungeon.');
        
        // Restore party health to 1
        this.party.forEach(m => {
            m.CurrentHealth = 1;
            m.CurrentSkillPoints = m.TotalSkillPoints;
        });
        
        this.currentCombat = null;
        this.dungeonState = null;
        
        setTimeout(() => this.renderLocation(), 3000);
    }
}

// Export for use in game files
window.GameEngine = GameEngine;
