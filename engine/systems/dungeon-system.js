import { BUTTON_TYPES } from '../ui/ui-manager.js';

export class DungeonSystem {
    constructor(ui, {
        onStartCombat,
        onExitDungeon
    }) {
        this.ui = ui;
        this.onStartCombat = onStartCombat;
        this.onExitDungeon = onExitDungeon;
        this.dungeonState = null;
    }

    isActive() {
        return Boolean(this.dungeonState);
    }

    enter(location) {
        this.dungeonState = {
            name: location.Name,
            monsters: Array.isArray(location.Monsters) ? location.Monsters : [],
            numFloors: location.NumFloors || 1,
            currentFloor: 0
        };

        this.render();
    }

    render() {
        if (!this.dungeonState) return;

        const { name, currentFloor, numFloors } = this.dungeonState;
        const isAtEntrance = currentFloor === 0;

        this.ui.showLocation({
            name: `${name} - Floor ${isAtEntrance ? 'Entrance' : currentFloor}`,
            description: isAtEntrance
                ? 'You enter the dungeon. The air grows cold and distant echoes swirl around you.'
                : `Floor ${currentFloor} of ${numFloors}. The path ahead coils into darkness.`
        });

        const choices = [
            {
                label: isAtEntrance ? 'Begin Exploration' : 'Explore Further',
                onSelect: () => this.#explore(),
                type: BUTTON_TYPES.NORMAL
            },
            {
                label: 'Leave Dungeon',
                onSelect: () => this.exit(),
                type: BUTTON_TYPES.NORMAL
            }
        ];

        this.ui.renderChoices(choices);
    }

    handleVictory() {
        if (!this.dungeonState) return { completed: false };

        this.dungeonState.currentFloor += 1;

        if (this.dungeonState.currentFloor > this.dungeonState.numFloors) {
            const numFloors = this.dungeonState.numFloors;
            this.exit();
            return { completed: true, numFloors };
        }

        this.render();
        return { completed: false };
    }

    handleDefeat() {
        this.exit();
    }

    exit() {
        this.dungeonState = null;
        if (this.onExitDungeon) {
            this.onExitDungeon();
        }
    }

    #explore() {
        if (!this.dungeonState) return;

        const { monsters } = this.dungeonState;
        const encounterChance = Math.random();
        const shouldFight = encounterChance < 0.7 && monsters.length > 0;

        if (shouldFight) {
            const monsterName = monsters[Math.floor(Math.random() * monsters.length)];
            this.onStartCombat(monsterName);
            return;
        }

        this.ui.showQuickMessage('Nothing here... moving forward.');
        setTimeout(() => {
            this.dungeonState.currentFloor += 1;
            if (this.dungeonState.currentFloor > this.dungeonState.numFloors) {
                this.ui.showDialog({
                    title: 'Dungeon Complete!',
                    message: `You have cleared all ${this.dungeonState.numFloors} floors!`,
                    onClose: () => this.exit()
                });
            } else {
                this.render();
            }
        }, 1000);
    }
}
