import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { UIManager } from '../engine/ui/ui-manager.js';

const buildDom = () => {
    document.body.innerHTML = `
        <div>
            <h1 id="location-name" tabindex="0"></h1>
            <div id="location-image-container"><img id="location-image" alt=""></div>
            <p id="description" tabindex="0"></p>
            <div id="choices"></div>
            <div id="loading"></div>
            <span id="gold-amount"></span>
        </div>
    `;
};

describe('UIManager', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        buildDom();
    });

    afterEach(() => {
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
        vi.restoreAllMocks();
        document.body.innerHTML = '';
    });

    it('focuses the location heading after showing a location when no overlays are present', () => {
        const ui = new UIManager();
        const heading = document.getElementById('location-name');
        heading.focus = vi.fn();

        ui.showLocation({ name: 'Kingsvale', description: 'A bustling town.', imageUrl: null });
        vi.runAllTimers();

        expect(heading.focus).toHaveBeenCalledWith({ preventScroll: true });
    });

    it('skips focusing the heading if a dialog overlay is active', () => {
        const ui = new UIManager();
        const heading = document.getElementById('location-name');
        heading.focus = vi.fn();

        const overlay = document.createElement('div');
        overlay.className = 'dialog-overlay';
        document.body.appendChild(overlay);

        ui.showLocation({ name: 'Kingsvale', description: 'A bustling town.', imageUrl: null });
        vi.runAllTimers();

        expect(heading.focus).not.toHaveBeenCalled();
        overlay.remove();
    });

    it('skips focusing the heading if a quick message is active', () => {
        const ui = new UIManager();
        const heading = document.getElementById('location-name');
        heading.focus = vi.fn();

        const quick = document.createElement('div');
        quick.className = 'quick-message';
        document.body.appendChild(quick);

        ui.showLocation({ name: 'Kingsvale', description: 'A bustling town.', imageUrl: null });
        vi.runAllTimers();

        expect(heading.focus).not.toHaveBeenCalled();
        quick.remove();
    });

    it('focuses the heading when combat status is shown', () => {
        const ui = new UIManager();
        const heading = document.getElementById('location-name');
        heading.focus = vi.fn();

        ui.showCombatStatus({
            monsterName: 'Imp',
            monsterHealth: { current: 6, total: 10 },
            partyStatus: ['Aria: 20/20 HP']
        });
        vi.runAllTimers();

        expect(heading.focus).toHaveBeenCalled();
    });

    it('renders choice buttons without auto-focusing by default', () => {
        const ui = new UIManager();
        const focusSpy = vi.spyOn(ui, 'focusFirstAvailableChoice');

        ui.renderChoices([
            { label: 'Option A', onSelect: vi.fn() }
        ]);

        const buttons = document.querySelectorAll('#choices button');
        expect(buttons).toHaveLength(1);
        expect(buttons[0].textContent).toBe('Option A');
        expect(focusSpy).not.toHaveBeenCalled();
    });

    it('reverses choice order when requested and can auto-focus on demand', () => {
        const ui = new UIManager();
        const focusSpy = vi.spyOn(ui, 'focusFirstAvailableChoice');

        ui.renderChoices([
            { label: 'First', onSelect: vi.fn() },
            { label: 'Second', onSelect: vi.fn() }
        ], { reverse: true, focusFirstChoice: true });

        const buttons = Array.from(document.querySelectorAll('#choices button'));
        expect(buttons.map(btn => btn.textContent)).toEqual(['Second', 'First']);
        expect(focusSpy).toHaveBeenCalledTimes(1);
    });
});
