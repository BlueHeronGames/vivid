import { BUTTON_TYPES } from '../ui/ui-manager.js';

export function buildLocationChoices({ location, state, actions }) {
    const choices = [];

    if (location.LinkedLocations) {
        location.LinkedLocations.forEach(link => {
            if (link.SwitchRequired && !state.isSwitchActive(link.SwitchRequired)) {
                return;
            }

            const isNewlyUnlocked = Boolean(link.SwitchRequired) && !state.hasVisited(link.Id);
            choices.push({
                label: isNewlyUnlocked ? `${link.Description || link.Id} *` : (link.Description || link.Id),
                onSelect: () => actions.onGoToLocation(link.Id),
                type: isNewlyUnlocked ? BUTTON_TYPES.NEWLY_UNLOCKED : BUTTON_TYPES.NORMAL
            });
        });
    }

    if (location.NPCs) {
        location.NPCs.forEach((npc, index) => {
            choices.push({
                label: `Talk to ${npc.Name}`,
                onSelect: () => actions.onTalkToNpc(index),
                type: BUTTON_TYPES.NORMAL
            });
        });
    }

    if (location.Shop) {
        choices.push({
            label: 'Browse Shop',
            onSelect: () => actions.onOpenShop(location.Shop),
            type: BUTTON_TYPES.NORMAL
        });
    }

    if (location.PricePerNight) {
        choices.push({
            label: `Rest at Inn (${location.PricePerNight} gold)`,
            onSelect: () => actions.onRestAtInn(location.PricePerNight),
            type: BUTTON_TYPES.NORMAL
        });
    }

    if (location.IsDungeon) {
        choices.push({
            label: '⚔️ Enter Dungeon *',
            onSelect: () => actions.onEnterDungeon(),
            type: BUTTON_TYPES.DUNGEON
        });
    }

    return choices;
}
