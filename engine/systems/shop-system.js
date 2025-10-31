export class ShopSystem {
    constructor(state, ui, { onStateChange }) {
        this.state = state;
        this.ui = ui;
        this.onStateChange = onStateChange;
    }

    open(shopConfig) {
        const items = shopConfig?.ItemsForSale || [];

        if (items.length === 0) {
            this.ui.showDialog({
                title: 'Shop',
                message: 'No items available.'
            });
            return;
        }

        const content = document.createElement('div');
        content.className = 'shop-items';

        const goldDisplay = document.createElement('p');
        goldDisplay.className = 'gold-display';
        goldDisplay.textContent = `Your Gold: ${this.state.gold}`;
        goldDisplay.tabIndex = 0;

        items.forEach(item => {
            const itemRow = document.createElement('div');
            itemRow.className = 'shop-item';

            const info = document.createElement('div');
            info.className = 'shop-item-info';

            const name = document.createElement('span');
            name.className = 'shop-item-name';
            name.textContent = item.Name;
            name.tabIndex = 0;

            info.appendChild(name);

            if (item.Description) {
                const desc = document.createElement('span');
                desc.className = 'shop-item-desc';
                desc.textContent = item.Description;
                desc.tabIndex = 0;
                info.appendChild(desc);
            }

            const price = document.createElement('span');
            price.className = 'shop-item-price';
            price.textContent = `${item.Price || 0} gold`;
            price.tabIndex = 0;
            info.appendChild(price);

            const buyButton = document.createElement('button');
            buyButton.className = 'shop-buy-button';
            buyButton.textContent = 'Buy';
            buyButton.tabIndex = 0;

            const updateButtonState = () => {
                const canAfford = this.state.gold >= (item.Price || 0);
                buyButton.disabled = !canAfford;
                buyButton.classList.toggle('disabled', !canAfford);
            };

            buyButton.onclick = () => {
                if (this.state.spendGold(item.Price || 0)) {
                    this.state.addItem(item.Name, 1);
                    this.onStateChange();
                    goldDisplay.textContent = `Your Gold: ${this.state.gold}`;
                    this.ui.showQuickMessage(`Bought ${item.Name}!`);
                    updateButtonState();
                }
            };

            buyButton.onkeydown = event => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    buyButton.click();
                }
            };

            itemRow.appendChild(info);
            itemRow.appendChild(buyButton);
            content.appendChild(itemRow);

            updateButtonState();
        });

        const container = [goldDisplay, content];

        this.ui.showModal({
            title: 'Shop',
            content: container,
            buttons: [
                {
                    label: 'Leave Shop',
                    className: 'dialog-close',
                    onClick: () => {}
                }
            ]
        });
    }
}
