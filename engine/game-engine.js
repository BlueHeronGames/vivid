/**
 * TextBlade Web Engine - Modular Version
 * A web-based game engine for choice-driven RPG adventures
 */

import { StorageService } from './core/storage-service.js';
import { GameState } from './state/game-state.js';
import { UIManager } from './ui/ui-manager.js';
import { AudioManager } from './audio/audio-manager.js';
import { ShopSystem } from './systems/shop-system.js';
import { CombatSystem } from './systems/combat-system.js';
import { DungeonSystem } from './systems/dungeon-system.js';
import { buildLocationChoices } from './utils/choice-builder.js';

export class GameEngine {
    constructor(options = {}) {
        this.storage = new StorageService(options.storageKey);
        this.ui = new UIManager();
        this.audio = new AudioManager();
        
        this.gameData = null;
        this.state = null;
        this.currentLocation = null;
        
        this.items = {};
        this.monsters = {};
        this.skills = {};
        this.statuses = {};
        
        this.shopSystem = null;
        this.combatSystem = null;
        this.dungeonSystem = null;
        
        this.activeMode = 'explore';
        this.activeCombatContext = null;
        this.pendingLocationNavigation = false;
    }

    async init(gameDataPath) {
        this.ui.showLoading();
        
        try {
            await this.#loadGameData(gameDataPath);
            
            const savedData = this.storage.load();
            this.state = new GameState(this.gameData, savedData);
            
            this.#setupSystems();
            this.#bindUI();
            this.#handleStateChange();
            
            const startLocationId = this.state.currentLocationId || this.gameData.StartingLocationId;
            await this.goToLocation(startLocationId);
        } catch (error) {
            console.error(error);
            this.ui.showError(`Failed to initialize game: ${error.message}`);
        } finally {
            this.ui.hideLoading();
        }
    }

    async goToLocation(locationId) {
        if (!locationId) return;
        
        try {
            this.pendingLocationNavigation = true;
            const location = await this.#fetchLocation(locationId);
            this.pendingLocationNavigation = false;
            
            this.currentLocation = location;
            this.state.setCurrentLocation(locationId);
            this.activeMode = 'explore';
            
            this.#handleStateChange();
            this.#playLocationAudio();
            this.#renderLocation();
        } catch (error) {
            this.pendingLocationNavigation = false;
            console.error(error);
            this.ui.showError(`Failed to load location: ${error.message}`);
        }
    }

    async startNewGame() {
        this.storage.clear();
        this.state.startNewGame();
        this.currentLocation = null;
        this.activeMode = 'explore';
        this.activeCombatContext = null;
        await this.goToLocation(this.gameData.StartingLocationId);
        this.ui.showQuickMessage('New game started!');
    }

    #setupSystems() {
        this.shopSystem = new ShopSystem(this.state, this.ui, {
            onStateChange: () => this.#handleStateChange()
        });
        
        this.dungeonSystem = new DungeonSystem(this.ui, {
            onStartCombat: monsterName => this.#startCombat(monsterName, { fromDungeon: true }),
            onExitDungeon: () => this.#exitDungeon()
        });
        
        this.combatSystem = new CombatSystem(this.state, this.ui, this.audio, this.gameData, {
            onVictory: monster => this.#handleCombatVictory(monster),
            onDefeat: () => this.#handleCombatDefeat(),
            onStateChange: () => this.#handleStateChange()
        });
    }

    #bindUI() {
        this.ui.bindStatusButtons({
            onParty: () => this.#showPartyScreen(),
            onInventory: () => this.#showInventoryScreen(),
            onNewGame: () => this.#confirmNewGame()
        });
    }

    async #loadGameData(path) {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error(`Failed to load game data: ${response.statusText}`);
        }
        
        this.gameData = await response.json();
        this.items = this.gameData.Items || {};
        this.monsters = this.gameData.Monsters || {};
        this.skills = this.gameData.Skills || {};
        this.statuses = this.gameData.Statuses || {};
    }

    async #fetchLocation(locationId) {
        const response = await fetch(`${locationId}.json`);
        if (!response.ok) {
            throw new Error(`Location not found: ${locationId}`);
        }
        return response.json();
    }

    #renderLocation() {
        if (!this.currentLocation) return;
        
        this.ui.showLocation({
            name: this.currentLocation.Name,
            description: this.currentLocation.Description,
            imageUrl: this.currentLocation.ImageUrl
        });
        
        this.#renderChoices();
    }

    #playLocationAudio() {
        if (!this.currentLocation) return;

        // Support both single BackgroundAudio string and BackgroundAudios array
        const audioFiles = this.currentLocation.BackgroundAudios || this.currentLocation.BackgroundAudio;
        
        if (audioFiles) {
            this.audio.playBackgroundAudio(audioFiles);
        } else {
            // Stop any currently playing audio if location has none
            this.audio.stopBackgroundAudio();
        }
    }

    #renderChoices() {
        if (!this.currentLocation || this.activeMode !== 'explore') return;
        
        const choices = buildLocationChoices({
            location: this.currentLocation,
            state: this.state,
            actions: {
                onGoToLocation: id => this.goToLocation(id),
                onTalkToNpc: index => this.#talkToNpc(index),
                onOpenShop: shop => this.shopSystem.open(shop),
                onRestAtInn: price => this.#restAtInn(price),
                onEnterDungeon: () => this.#enterDungeon()
            }
        });
        
        this.ui.renderChoices(choices, { reverse: true });
    }

    #enterDungeon() {
        if (!this.currentLocation?.IsDungeon) return;
        this.activeMode = 'dungeon';
        this.dungeonSystem.enter(this.currentLocation);
    }

    #exitDungeon() {
        this.activeMode = 'explore';
        if (!this.pendingLocationNavigation) {
            this.#renderLocation();
        }
    }

    #talkToNpc(npcIndex) {
        const npc = this.currentLocation?.NPCs?.[npcIndex];
        if (!npc) return;
        
        const talksCompleted = this.state.incrementNpcTalkCount(this.currentLocation.Name, npc.Name);
        let dialogText = '';
        
        if (Array.isArray(npc.Texts) && npc.Texts.length) {
            dialogText = npc.Texts[Math.min(talksCompleted, npc.Texts.length - 1)];
        } else if (typeof npc.Text === 'string') {
            dialogText = npc.Text;
        }
        
        this.ui.showDialog({
            title: npc.Name,
            message: dialogText || '...'
        });
        
        if (npc.OnTalk) {
            this.#executeAction(npc.OnTalk);
        }
        
        this.#handleStateChange();
        this.#renderChoices();
    }

    #executeAction(action) {
        if (!action?.$type) return;
        
        const actionType = action.$type.split(',')[0].split('.').pop();
        
        switch (actionType) {
            case 'SetSwitchAction':
                this.state.setSwitch(action.SwitchName, action.Value);
                break;
            case 'GiveItemAction':
                this.state.addItem(action.ItemName, action.Quantity || 1);
                break;
            default:
                console.warn(`Unsupported action: ${actionType}`);
        }
    }

    #restAtInn(price) {
        if (price > 0 && !this.state.spendGold(price)) {
            this.ui.showQuickMessage('Not enough gold.');
            return;
        }
        
        this.state.healParty();
        this.#handleStateChange();
        
        this.ui.showDialog({
            title: 'Inn',
            message: `You rested and fully recovered!${price > 0 ? ` (-${price} gold)` : ''}`
        });
    }

    #startCombat(monsterName, context = {}) {
        if (!this.monsters[monsterName]) {
            this.ui.showError(`Monster not found: ${monsterName}`);
            return;
        }
        
        // Fade out location audio and play battle theme
        this.audio.fadeOutBackgroundAudio(500).then(() => {
            const battleTheme = this.gameData.BattleTheme || 'audio/bgm/battle.ogg';
            this.audio.playBackgroundAudio(battleTheme);
        });
        
        this.activeCombatContext = context;
        this.activeMode = 'combat';
        this.combatSystem.startEncounter(monsterName);
    }

    #handleCombatVictory(monster) {
        this.state.addGold(monster.Gold || 0);
        this.state.addExperience(monster.ExperiencePoints || 0);
        this.#handleStateChange();
        
        this.ui.showDialog({
            title: 'Victory!',
            message: `You defeated ${monster.Name}!\n\nGained ${monster.Gold || 0} gold and ${monster.ExperiencePoints || 0} XP.`,
            onClose: () => this.#afterCombatVictory()
        });
    }

    #afterCombatVictory() {
        const fromDungeon = Boolean(this.activeCombatContext?.fromDungeon);
        this.activeCombatContext = null;
        
        // Stop battle music and restore location audio
        this.audio.stopBackgroundAudio();
        this.#playLocationAudio();
        
        if (fromDungeon) {
            const result = this.dungeonSystem.handleVictory();
            if (result?.completed) {
                this.ui.showDialog({
                    title: 'Dungeon Complete!',
                    message: `You cleared all ${result.numFloors} floors!`
                });
            }
        } else {
            this.activeMode = 'explore';
            this.#renderLocation();
        }
    }

    #handleCombatDefeat() {
        this.state.party.forEach(m => {
            m.CurrentHealth = 1;
            m.CurrentSkillPoints = m.TotalSkillPoints;
        });
        this.#handleStateChange();
        
        this.ui.showDialog({
            title: 'Defeat...',
            message: 'Your party retreats to recover.',
            onClose: () => this.#afterCombatDefeat()
        });
    }

    #afterCombatDefeat() {
        const fromDungeon = Boolean(this.activeCombatContext?.fromDungeon);
        this.activeCombatContext = null;
        
        // Stop battle music and restore location audio
        this.audio.stopBackgroundAudio();
        this.#playLocationAudio();
        
        if (fromDungeon) {
            this.dungeonSystem.handleDefeat();
            this.ui.showQuickMessage('You regroup at the dungeon entrance.');
        } else {
            this.activeMode = 'explore';
            this.#renderLocation();
        }
    }

    #showInventoryScreen() {
        const container = document.createElement('div');
        container.className = 'inventory-items';
        
        const entries = Object.entries(this.state.inventory);
        if (entries.length === 0) {
            const msg = document.createElement('p');
            msg.textContent = 'Your inventory is empty.';
            msg.tabIndex = 0;
            container.appendChild(msg);
        } else {
            entries.forEach(([name, qty]) => {
                const row = document.createElement('div');
                row.className = 'inventory-item';
                
                const nameEl = document.createElement('span');
                nameEl.className = 'inventory-item-name';
                nameEl.textContent = name;
                nameEl.tabIndex = 0;
                
                const qtyEl = document.createElement('span');
                qtyEl.className = 'inventory-item-qty';
                qtyEl.textContent = `x${qty}`;
                qtyEl.tabIndex = 0;
                
                row.appendChild(nameEl);
                row.appendChild(qtyEl);
                container.appendChild(row);
            });
        }
        
        this.ui.showModal({
            title: 'Inventory',
            content: container,
            buttons: [{ label: 'Close', className: 'dialog-close' }]
        });
    }

    #showPartyScreen() {
        const container = document.createElement('div');
        container.className = 'party-members';
        
        this.state.party.forEach(member => {
            const card = document.createElement('div');
            card.className = 'party-member-card';
            
            const name = document.createElement('h3');
            name.textContent = member.Name;
            name.tabIndex = 0;
            card.appendChild(name);
            
            const stats = document.createElement('div');
            stats.className = 'party-stats';
            stats.innerHTML = `
                <div class="stat-row"><span tabindex="0">HP:</span> <span class="stat-value" tabindex="0">${member.CurrentHealth || 0} / ${member.TotalHealth || 0}</span></div>
                <div class="stat-row"><span tabindex="0">SP:</span> <span class="stat-value" tabindex="0">${member.CurrentSkillPoints || 0} / ${member.TotalSkillPoints || 0}</span></div>
                <div class="stat-row"><span tabindex="0">Strength:</span> <span class="stat-value" tabindex="0">${member.Strength || 0}</span></div>
                <div class="stat-row"><span tabindex="0">Toughness:</span> <span class="stat-value" tabindex="0">${member.Toughness || 0}</span></div>
                <div class="stat-row"><span tabindex="0">Special:</span> <span class="stat-value" tabindex="0">${member.Special || 0}</span></div>
                <div class="stat-row"><span tabindex="0">Special Defense:</span> <span class="stat-value" tabindex="0">${member.SpecialDefense || 0}</span></div>
            `;
            card.appendChild(stats);
            
            if (Array.isArray(member.Skills) && member.Skills.length) {
                const skillsTitle = document.createElement('h4');
                skillsTitle.textContent = 'Skills:';
                skillsTitle.tabIndex = 0;
                card.appendChild(skillsTitle);
                
                const skillsList = document.createElement('div');
                skillsList.className = 'skills-list';
                member.Skills.forEach(skill => {
                    const badge = document.createElement('span');
                    badge.className = 'skill-badge';
                    badge.textContent = skill;
                    badge.tabIndex = 0;
                    skillsList.appendChild(badge);
                });
                card.appendChild(skillsList);
            }
            
            container.appendChild(card);
        });
        
        this.ui.showModal({
            title: 'Party',
            content: container,
            buttons: [{ label: 'Close', className: 'dialog-close' }]
        });
    }

    #confirmNewGame() {
        this.ui.showModal({
            title: 'Start New Game?',
            description: 'This will delete your current save. Are you sure?',
            buttons: [
                { label: 'Yes, Start New Game', className: 'dialog-close', onClick: () => this.startNewGame() },
                { label: 'Cancel', className: 'dialog-close' }
            ]
        });
    }

    #handleStateChange() {
        this.ui.updateGoldDisplay(this.state.gold);
        this.#saveGame();
    }

    #saveGame() {
        if (!this.state) return;
        this.storage.save({ ...this.state.toJSON(), timestamp: Date.now() });
    }
}

if (typeof window !== 'undefined') {
    window.GameEngine = GameEngine;
}
