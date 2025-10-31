import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DungeonSystem } from '../engine/systems/dungeon-system.js';

const buildLocation = () => ({
  Name: 'North Seaside Cave',
  Monsters: ['Goblin', 'Spider'],
  NumFloors: 2
});

describe('DungeonSystem', () => {
  let ui;
  let onStartCombat;
  let onExitDungeon;
  let dungeon;

  beforeEach(() => {
    vi.useFakeTimers();
    ui = {
      showLocation: vi.fn(),
      renderChoices: vi.fn(),
      showQuickMessage: vi.fn(),
      showDialog: vi.fn()
    };
    onStartCombat = vi.fn();
    onExitDungeon = vi.fn();
    dungeon = new DungeonSystem(ui, { onStartCombat, onExitDungeon });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('enters a dungeon and renders choices', () => {
    dungeon.enter(buildLocation());

    expect(ui.showLocation).toHaveBeenCalledWith({
      name: 'North Seaside Cave - Floor Entrance',
      description: expect.stringContaining('enter the dungeon')
    });
    expect(ui.renderChoices).toHaveBeenCalled();

    const options = ui.renderChoices.mock.calls[0][0];
    expect(options).toHaveLength(2);
    expect(options[0].label).toBe('Begin Exploration');
    expect(options[1].label).toBe('Leave Dungeon');
  });

  it('triggers combat when an encounter occurs', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.2);

    dungeon.enter(buildLocation());
    const explore = ui.renderChoices.mock.calls[0][0][0];
    explore.onSelect();

    expect(onStartCombat).toHaveBeenCalled();
  });

  it('advances floors and completes the dungeon when no encounter happens', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.95);

    dungeon.enter(buildLocation());
    let explore = ui.renderChoices.mock.calls.at(-1)[0][0];
    explore.onSelect();

    expect(ui.showQuickMessage).toHaveBeenCalledWith('Nothing here... moving forward.');

    vi.advanceTimersByTime(1000);
    expect(ui.showLocation).toHaveBeenLastCalledWith({
      name: 'North Seaside Cave - Floor 1',
      description: expect.stringContaining('Floor 1 of 2')
    });

    explore = ui.renderChoices.mock.calls.at(-1)[0][0];
    explore.onSelect();
    vi.advanceTimersByTime(1000);

    expect(ui.showLocation).toHaveBeenLastCalledWith({
      name: 'North Seaside Cave - Floor 2',
      description: expect.stringContaining('Floor 2 of 2')
    });

    explore = ui.renderChoices.mock.calls.at(-1)[0][0];
    explore.onSelect();
    vi.advanceTimersByTime(1000);

    expect(ui.showDialog).toHaveBeenCalledWith({
      title: 'Dungeon Complete!',
      message: 'You have cleared all 2 floors!',
      onClose: expect.any(Function)
    });
  });

  it('reports completion and exits the dungeon on victory', () => {
    dungeon.enter(buildLocation());
    dungeon.dungeonState.currentFloor = 2;

    const result = dungeon.handleVictory();

    expect(result).toEqual({ completed: true, numFloors: 2 });
    expect(onExitDungeon).toHaveBeenCalled();
  });

  it('exits the dungeon on defeat', () => {
    dungeon.enter(buildLocation());
    dungeon.handleDefeat();
    expect(onExitDungeon).toHaveBeenCalled();
  });
});
