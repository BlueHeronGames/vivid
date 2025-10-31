import { describe, it, expect, beforeEach } from 'vitest';
import { GameState } from '../engine/state/game-state.js';

const buildGameData = () => ({
  StartingParty: [
    {
      Name: 'Ayla',
      CurrentHealth: 30,
      TotalHealth: 30,
      CurrentSkillPoints: 10,
      TotalSkillPoints: 10,
      Strength: 8,
      Toughness: 6,
      Special: 5,
      SpecialDefense: 4,
      Skills: ['Strike']
    }
  ],
  StartingGold: 120
});

describe('GameState', () => {
  let gameState;

  beforeEach(() => {
    gameState = new GameState(buildGameData());
  });

  it('initialises party, equipment and currency on new game', () => {
    const member = gameState.party[0];
    expect(member.Name).toBe('Ayla');
    expect(gameState.gold).toBe(120);
    expect(gameState.inventory).toEqual({});
    expect(gameState.equipment[member.Name]).toEqual({
      Weapon: null,
      Helmet: null,
      Armour: null
    });
  });

  it('applies saved data correctly', () => {
    const saveData = {
      currentLocationId: 'KingsVale/KingsVale',
      party: [{ Name: 'Corin' }],
      inventory: { Potion: 3 },
      equipment: { Corin: { Weapon: 'Sword', Helmet: null, Armour: null } },
      switches: { spokeToKing: true },
      talkCounters: { KingsVale_King: 2 },
      visited: ['KingsVale/KingsVale'],
      gold: 50,
      experience: 25
    };

    gameState.applySave(saveData);

    expect(gameState.currentLocationId).toBe('KingsVale/KingsVale');
    expect(gameState.party).toEqual(saveData.party);
    expect(gameState.inventory).toEqual({ Potion: 3 });
    expect(gameState.switches.spokeToKing).toBe(true);
    expect(gameState.visited.has('KingsVale/KingsVale')).toBe(true);
    expect(gameState.gold).toBe(50);
    expect(gameState.experience).toBe(25);
  });

  it('tracks location visitation and switches', () => {
    expect(gameState.hasVisited('KingsVale')).toBe(false);
    gameState.setCurrentLocation('KingsVale');
    expect(gameState.currentLocationId).toBe('KingsVale');
    expect(gameState.hasVisited('KingsVale')).toBe(true);

    gameState.setSwitch('introComplete', true);
    expect(gameState.isSwitchActive('introComplete')).toBe(true);
  });

  it('manages inventory and gold', () => {
    gameState.addItem('Potion', 2);
    gameState.addItem('Potion', 1);
    expect(gameState.inventory.Potion).toBe(3);

    expect(gameState.spendGold(30)).toBe(true);
    expect(gameState.gold).toBe(90);
    expect(gameState.spendGold(500)).toBe(false);
    expect(gameState.gold).toBe(90);

    gameState.addGold(45);
    expect(gameState.gold).toBe(135);
  });

  it('tracks NPC conversations', () => {
    expect(gameState.getNpcTalkCount('KingsVale', 'King')).toBe(0);
    const first = gameState.incrementNpcTalkCount('KingsVale', 'King');
    expect(first).toBe(0);
    const second = gameState.incrementNpcTalkCount('KingsVale', 'King');
    expect(second).toBe(1);
    expect(gameState.getNpcTalkCount('KingsVale', 'King')).toBe(2);

    gameState.resetNpcTalkCount('KingsVale', 'King');
    expect(gameState.getNpcTalkCount('KingsVale', 'King')).toBe(0);
  });

  it('heals the entire party', () => {
    const member = gameState.party[0];
    member.CurrentHealth = 5;
    member.CurrentSkillPoints = 2;

    gameState.healParty();
    expect(member.CurrentHealth).toBe(member.TotalHealth);
    expect(member.CurrentSkillPoints).toBe(member.TotalSkillPoints);
  });

  it('serialises to JSON without sets', () => {
    gameState.setCurrentLocation('KingsVale');
    gameState.addItem('Potion', 1);
    gameState.incrementNpcTalkCount('KingsVale', 'King');

    const json = gameState.toJSON();
    expect(json).toMatchObject({
      currentLocationId: 'KingsVale',
      inventory: { Potion: 1 },
      visited: ['KingsVale']
    });
    expect(Array.isArray(json.visited)).toBe(true);
  });
});
