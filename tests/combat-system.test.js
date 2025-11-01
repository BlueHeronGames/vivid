import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CombatSystem } from '../engine/systems/combat-system.js';

const buildGameData = () => ({
  Monsters: {
    Goblin: {
      Health: 10,
      Strength: 3,
      Toughness: 1,
      Gold: 8,
      ExperiencePoints: 12
    }
  },
  Skills: {
    Fireball: {
      Cost: 3,
      DamageMultiplier: 2,
      DamageType: 'Fire'
    },
    Mend: {
      Cost: 2,
      DamageMultiplier: 0.5,
      Target: 'SingleFriend'
    }
  }
});

describe('CombatSystem', () => {
  let state;
  let ui;
  let audio;
  let gameData;
  let onVictory;
  let onDefeat;
  let onStateChange;
  let combat;

  beforeEach(() => {
    vi.useFakeTimers();

    state = {
      party: [
        {
          Name: 'Ayla',
          CurrentHealth: 10,
          TotalHealth: 10,
          CurrentSkillPoints: 6,
          TotalSkillPoints: 6,
          Strength: 12,
          Toughness: 4,
          Special: 5,
          Skills: ['Fireball', 'Mend']
        }
      ]
    };

    ui = {
      showCombatStatus: vi.fn(),
      renderChoices: vi.fn(),
      disableChoices: vi.fn(),
      showQuickMessage: vi.fn()
    };

    audio = {
      playSoundEffect: vi.fn(),
      playSoundSequence: vi.fn()
    };

    gameData = buildGameData();
    onVictory = vi.fn();
    onDefeat = vi.fn();
    onStateChange = vi.fn();

    combat = new CombatSystem(state, ui, audio, gameData, { onVictory, onDefeat, onStateChange });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('creates a combat encounter and renders player actions', () => {
    combat.startEncounter('Goblin');

    expect(ui.showCombatStatus).toHaveBeenCalled();
    expect(ui.renderChoices).toHaveBeenCalled();

    const choices = ui.renderChoices.mock.calls[0][0];
    expect(choices).toHaveLength(3); // Attack + 2 skills
    expect(choices[0].label).toBe('Ayla: Attack');
  });

  it('resolves an attack and triggers victory when monster HP reaches zero', () => {
    combat.startEncounter('Goblin');
    const choices = ui.renderChoices.mock.calls[0][0];
    const attack = choices[0];

    attack.onSelect();

    expect(ui.disableChoices).toHaveBeenCalled();
    expect(ui.showQuickMessage).toHaveBeenCalledWith('Ayla attacks for 11 damage!');

    vi.advanceTimersByTime(950);

    expect(onVictory).toHaveBeenCalled();
    const victoryMonster = onVictory.mock.calls[0][0];
    expect(victoryMonster.Name).toBe('Goblin');
  });

  it('heals allies when using a support skill', () => {
    state.party[0].Strength = 6; // ensure monster survives
    state.party[0].CurrentHealth = 3;

    combat.startEncounter('Goblin');
    const choices = ui.renderChoices.mock.calls[0][0];
    const mend = choices.find(choice => choice.label.startsWith('Ayla: Mend'));
    expect(mend).toBeTruthy();

    mend.onSelect();

    expect(ui.disableChoices).toHaveBeenCalled();
    expect(state.party[0].CurrentHealth).toBe(5);
    expect(ui.showQuickMessage).toHaveBeenCalledWith('Ayla uses Mend and heals 2 HP!');
    vi.runAllTimers();
  });

  it('notifies when SP is insufficient for a skill', () => {
    state.party[0].CurrentSkillPoints = 0;

    combat.startEncounter('Goblin');
    const choices = ui.renderChoices.mock.calls[0][0];
    const fireball = choices.find(choice => choice.label.startsWith('Ayla: Fireball'));
    expect(fireball.disabled).toBe(true);

    fireball.onSelect();

    expect(ui.showQuickMessage).toHaveBeenCalledWith('Not enough SP!');
    expect(ui.disableChoices).not.toHaveBeenCalled();
  });
});
