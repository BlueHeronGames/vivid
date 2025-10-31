import { describe, it, expect } from 'vitest';
import { buildLocationChoices } from '../engine/utils/choice-builder.js';
import { BUTTON_TYPES } from '../engine/ui/ui-manager.js';

describe('buildLocationChoices', () => {
  const baseState = {
    isSwitchActive: () => true,
    hasVisited: () => true
  };

  it('builds choices for linked locations with switch requirements', () => {
    const state = {
      ...baseState,
      isSwitchActive: (switchName) => switchName === 'gateOpen',
      hasVisited: () => false
    };

    const choices = buildLocationChoices({
      location: {
        LinkedLocations: [
          { Id: 'KingsVale/Inn', Description: 'Go to Inn' },
          { Id: 'KingsVale/Cave', Description: 'Enter Cave', SwitchRequired: 'gateOpen' },
          { Id: 'KingsVale/TownHall', Description: 'Town Hall', SwitchRequired: 'mayorPermit' }
        ]
      },
      state,
      actions: {
        onGoToLocation: () => {},
        onTalkToNpc: () => {},
        onOpenShop: () => {},
        onRestAtInn: () => {},
        onEnterDungeon: () => {}
      }
    });

    expect(choices).toHaveLength(2);
    expect(choices[0].label).toBe('Go to Inn');
    expect(choices[0].type).toBe(BUTTON_TYPES.NORMAL);
    expect(choices[1].label).toBe('Enter Cave *');
    expect(choices[1].type).toBe(BUTTON_TYPES.NEWLY_UNLOCKED);
  });

  it('includes NPC, shop, inn and dungeon actions', () => {
    const actions = {
      onGoToLocation: () => {},
      onTalkToNpc: () => {},
      onOpenShop: () => {},
      onRestAtInn: () => {},
      onEnterDungeon: () => {}
    };

    const choices = buildLocationChoices({
      location: {
        LinkedLocations: [],
        NPCs: [{ Name: 'Merchant' }],
        Shop: { ItemsForSale: [] },
        PricePerNight: 25,
        IsDungeon: true
      },
      state: baseState,
      actions
    });

    expect(choices.map(choice => choice.label)).toEqual([
      'Talk to Merchant',
      'Browse Shop',
      'Rest at Inn (25 gold)',
      '⚔️ Enter Dungeon *'
    ]);
    expect(choices[3].type).toBe(BUTTON_TYPES.DUNGEON);
  });
});
