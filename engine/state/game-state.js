export class GameState {
    constructor(gameData, savedData = null) {
        this.gameData = gameData;
        this.reset();

        if (savedData) {
            this.applySave(savedData);
        } else {
            this.startNewGame();
        }
    }

    reset() {
        this.currentLocationId = null;
        this.party = [];
        this.inventory = {};
        this.equipment = {};
        this.switches = {};
        this.talkCounters = {};
        this.visited = new Set();
        this.gold = 0;
        this.experience = 0;
    }

    startNewGame() {
        const startingParty = this.gameData.StartingParty || [];
        this.party = JSON.parse(JSON.stringify(startingParty));
        this.inventory = {};
        this.equipment = {};
        this.switches = {};
        this.talkCounters = {};
        this.visited = new Set();
        this.gold = this.gameData.StartingGold || 100;
        this.experience = 0;

        this.party.forEach(member => {
            this.equipment[member.Name] = {
                Weapon: null,
                Helmet: null,
                Armour: null
            };
        });
    }

    applySave(saveData) {
        this.currentLocationId = saveData.currentLocationId || null;
        this.party = saveData.party || [];
        this.inventory = saveData.inventory || {};
        this.equipment = saveData.equipment || {};
        this.switches = saveData.switches || {};
        this.talkCounters = saveData.talkCounters || {};
        this.visited = new Set(saveData.visited || []);
        this.gold = typeof saveData.gold === 'number' ? saveData.gold : (this.gameData.StartingGold || 100);
        this.experience = saveData.experience || 0;
    }

    toJSON() {
        return {
            currentLocationId: this.currentLocationId,
            party: this.party,
            inventory: this.inventory,
            equipment: this.equipment,
            switches: this.switches,
            talkCounters: this.talkCounters,
            visited: Array.from(this.visited),
            gold: this.gold,
            experience: this.experience
        };
    }

    setCurrentLocation(locationId) {
        this.currentLocationId = locationId;
        this.markVisited(locationId);
    }

    markVisited(locationId) {
        this.visited.add(locationId);
    }

    hasVisited(locationId) {
        return this.visited.has(locationId);
    }

    addGold(amount) {
        this.gold += amount;
    }

    spendGold(amount) {
        if (this.gold < amount) {
            return false;
        }
        this.gold -= amount;
        return true;
    }

    addExperience(amount) {
        this.experience += amount;
    }

    addItem(itemName, quantity = 1) {
        this.inventory[itemName] = (this.inventory[itemName] || 0) + quantity;
    }

    setSwitch(name, value) {
        this.switches[name] = value;
    }

    isSwitchActive(name) {
        return Boolean(this.switches[name]);
    }

    incrementNpcTalkCount(locationName, npcName) {
        const key = `${locationName}_${npcName}`;
        const current = this.talkCounters[key] || 0;
        this.talkCounters[key] = current + 1;
        return current;
    }

    resetNpcTalkCount(locationName, npcName) {
        const key = `${locationName}_${npcName}`;
        this.talkCounters[key] = 0;
    }

    getNpcTalkCount(locationName, npcName) {
        const key = `${locationName}_${npcName}`;
        return this.talkCounters[key] || 0;
    }

    healParty() {
        this.party.forEach(member => {
            member.CurrentHealth = member.TotalHealth;
            member.CurrentSkillPoints = member.TotalSkillPoints;
        });
    }
}
