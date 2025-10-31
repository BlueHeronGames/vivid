import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ShopSystem } from '../engine/systems/shop-system.js';

describe('ShopSystem', () => {
  let state;
  let ui;
  let onStateChange;
  let shop;

  beforeEach(() => {
    state = {
      gold: 100,
      inventory: {},
      spendGold: vi.fn(function spendGold(amount) {
        if (this.gold < amount) {
          return false;
        }
        this.gold -= amount;
        return true;
      }),
      addItem: vi.fn(function addItem(name, qty = 1) {
        this.inventory[name] = (this.inventory[name] || 0) + qty;
      })
    };

    ui = {
      showDialog: vi.fn(),
      showModal: vi.fn(),
      showQuickMessage: vi.fn()
    };

    onStateChange = vi.fn();
    shop = new ShopSystem(state, ui, { onStateChange });
  });

  it('shows empty message when no items are available', () => {
    shop.open({ ItemsForSale: [] });
    expect(ui.showDialog).toHaveBeenCalledWith({
      title: 'Shop',
      message: 'No items available.'
    });
    expect(ui.showModal).not.toHaveBeenCalled();
  });

  it('allows purchasing an item and updates state', () => {
    const potion = { Name: 'Potion', Description: 'Heals 50 HP', Price: 60 };

    shop.open({ ItemsForSale: [potion] });
    expect(ui.showModal).toHaveBeenCalled();

    const modalConfig = ui.showModal.mock.calls[0][0];
    expect(modalConfig.title).toBe('Shop');

  const [goldDisplay, content] = modalConfig.content;
    expect(goldDisplay.textContent).toBe('Your Gold: 100');
  const buyButton = content.querySelector('.shop-buy-button');
    expect(buyButton).toBeTruthy();
    expect(buyButton.disabled).toBe(false);

    buyButton.click();

    expect(state.spendGold).toHaveBeenCalledWith(60);
    expect(state.gold).toBe(40);
    expect(state.addItem).toHaveBeenCalledWith('Potion', 1);
    expect(state.inventory.Potion).toBe(1);
    expect(onStateChange).toHaveBeenCalled();
    expect(ui.showQuickMessage).toHaveBeenCalledWith('Bought Potion!');
    expect(goldDisplay.textContent).toBe('Your Gold: 40');
    expect(buyButton.disabled).toBe(true);
    expect(buyButton.classList.contains('disabled')).toBe(true);
  });

  it('disables buying when the player cannot afford the item', () => {
    state.gold = 10;
    const elixir = { Name: 'Elixir', Price: 50 };

    shop.open({ ItemsForSale: [elixir] });
    const modalConfig = ui.showModal.mock.calls[0][0];
  const [, content] = modalConfig.content;
  const buyButton = content.querySelector('.shop-buy-button');

    expect(buyButton.disabled).toBe(true);
    expect(buyButton.classList.contains('disabled')).toBe(true);

    buyButton.click();
    expect(state.spendGold).not.toHaveBeenCalled();
    expect(state.addItem).not.toHaveBeenCalled();
    expect(ui.showQuickMessage).not.toHaveBeenCalled();
  });
});
