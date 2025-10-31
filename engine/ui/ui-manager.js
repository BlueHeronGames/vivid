const BUTTON_TYPES = {
    NORMAL: 'normal',
    DUNGEON: 'dungeon',
    NEWLY_UNLOCKED: 'newly-unlocked'
};

export class UIManager {
    constructor() {
        this.locationNameEl = document.getElementById('location-name');
        this.locationImageContainerEl = document.getElementById('location-image-container');
        this.locationImageEl = document.getElementById('location-image');
        this.descriptionEl = document.getElementById('description');
        this.choicesEl = document.getElementById('choices');
        this.loadingEl = document.getElementById('loading');
        this.goldAmountEl = document.getElementById('gold-amount');
    }

    bindStatusButtons({ onParty, onInventory, onNewGame }) {
        const partyButton = document.getElementById('party-button');
        const inventoryButton = document.getElementById('inventory-button');
        const newGameButton = document.getElementById('new-game-button');

        if (partyButton) {
            partyButton.onclick = onParty;
            partyButton.onkeydown = this.#createKeyboardHandler(onParty);
        }
        if (inventoryButton) {
            inventoryButton.onclick = onInventory;
            inventoryButton.onkeydown = this.#createKeyboardHandler(onInventory);
        }
        if (newGameButton) {
            newGameButton.onclick = onNewGame;
            newGameButton.onkeydown = this.#createKeyboardHandler(onNewGame);
        }
    }

    showLoading() {
        if (this.loadingEl) {
            this.loadingEl.style.display = 'flex';
        }
    }

    hideLoading() {
        if (this.loadingEl) {
            this.loadingEl.style.display = 'none';
        }
    }

    showError(message) {
        if (!this.loadingEl) {
            console.error(message);
            return;
        }
        this.loadingEl.innerHTML = `
            <div class="error">
                <h2 tabindex="0">Error</h2>
                <p tabindex="0">${message}</p>
            </div>
        `;
        this.loadingEl.style.display = 'flex';
    }

    updateGoldDisplay(amount) {
        if (this.goldAmountEl) {
            this.goldAmountEl.textContent = amount;
        }
    }

    showLocation({ name, description, imageUrl }) {
        if (this.locationNameEl) {
            this.locationNameEl.textContent = name || 'Unknown Location';
        }

        if (imageUrl) {
            if (this.locationImageEl) {
                this.locationImageEl.src = imageUrl;
                this.locationImageEl.alt = name || '';
            }
            if (this.locationImageContainerEl) {
                this.locationImageContainerEl.style.display = 'flex';
            }
        } else if (this.locationImageContainerEl) {
            this.locationImageContainerEl.style.display = 'none';
        }

        if (this.descriptionEl) {
            this.descriptionEl.textContent = description || '';
        }

        this.#focusLocationHeading();
    }

    showCombatStatus({ monsterName, monsterHealth, partyStatus }) {
        if (this.locationNameEl) {
            this.locationNameEl.textContent = `Battle: ${monsterName}`;
        }
        if (this.locationImageContainerEl) {
            this.locationImageContainerEl.style.display = 'none';
        }
        if (this.descriptionEl) {
            this.descriptionEl.innerHTML = `
                <div class="combat-status">
                    <div class="monster-status" tabindex="0">
                        <strong>${monsterName}</strong><br>
                        HP: ${monsterHealth.current} / ${monsterHealth.total}
                    </div>
                    <div class="party-status-compact" tabindex="0">
                        ${partyStatus.map(text => `<div>${text}</div>`).join('')}
                    </div>
                </div>
            `;
        }

        this.#focusLocationHeading();
    }

    renderChoices(choices, options = {}) {
        if (!this.choicesEl) return;

        const { reverse = false, focusFirstChoice = false } = options;

        this.choicesEl.innerHTML = '';
        const orderedChoices = reverse ? [...choices].reverse() : choices;

        orderedChoices.forEach(choice => {
            const button = document.createElement('button');
            button.className = this.#getChoiceClass(choice.type);
            button.textContent = choice.label;
            button.tabIndex = 0;
            button.disabled = Boolean(choice.disabled);
            button.onclick = () => choice.onSelect();
            button.onkeydown = this.#createKeyboardHandler(choice.onSelect);
            this.choicesEl.appendChild(button);
        });

        if (focusFirstChoice) {
            this.focusFirstAvailableChoice();
        }
    }

    disableChoices() {
        if (!this.choicesEl) return;
        const buttons = this.choicesEl.querySelectorAll('button');
        buttons.forEach(button => {
            button.disabled = true;
        });
    }

    focusFirstAvailableChoice() {
        if (!this.choicesEl) return;
        const firstEnabled = this.choicesEl.querySelector('button:not([disabled])');
        if (firstEnabled) {
            setTimeout(() => firstEnabled.focus(), 50);
        }
    }

    showDialog({ title, message, onClose }) {
        const description = document.createElement('p');
        description.textContent = message;
        description.tabIndex = 0;

        this.showModal({
            title,
            content: description,
            buttons: [
                {
                    label: 'Close',
                    className: 'dialog-close',
                    onClick: () => {},
                    isPrimary: true
                }
            ],
            onClose
        });
    }

    showModal({ title, description, content, buttons = [], onClose }) {
        const overlay = document.createElement('div');
        overlay.className = 'dialog-overlay';
        overlay.tabIndex = 0;

        const dialog = document.createElement('div');
        dialog.className = 'dialog';
        dialog.setAttribute('role', 'dialog');
        dialog.setAttribute('aria-labelledby', 'dialog-title');

        const dialogTitle = document.createElement('h2');
        dialogTitle.id = 'dialog-title';
        dialogTitle.textContent = title;
        dialogTitle.tabIndex = 0;
        dialog.appendChild(dialogTitle);

        if (description) {
            const dialogDescription = document.createElement('p');
            dialogDescription.textContent = description;
            dialogDescription.tabIndex = 0;
            dialog.appendChild(dialogDescription);
        }

        if (content) {
            if (Array.isArray(content)) {
                content.forEach(node => dialog.appendChild(node));
            } else {
                dialog.appendChild(content);
            }
        }

        if (buttons.length > 0) {
            const buttonContainer = document.createElement('div');
            buttonContainer.style.display = 'flex';
            buttonContainer.style.gap = '15px';
            buttonContainer.style.justifyContent = 'center';

            buttons.forEach(buttonConfig => {
                const button = document.createElement('button');
                button.textContent = buttonConfig.label;
                button.className = buttonConfig.className || 'dialog-close';
                button.tabIndex = 0;
                button.disabled = Boolean(buttonConfig.disabled);
                button.onclick = () => {
                    if (buttonConfig.onClick) {
                        buttonConfig.onClick();
                    }
                    this.#closeOverlay(overlay, onClose);
                };
                button.onkeydown = this.#createKeyboardHandler(() => button.click());
                buttonContainer.appendChild(button);
            });

            dialog.appendChild(buttonContainer);
        }

        overlay.onclick = event => {
            if (event.target === overlay) {
                this.#closeOverlay(overlay, onClose);
            }
        };

        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        setTimeout(() => {
            const firstButton = overlay.querySelector('button');
            if (firstButton) {
                firstButton.focus();
            } else {
                overlay.focus();
            }
        }, 60);

        return () => this.#closeOverlay(overlay, onClose);
    }

    showQuickMessage(message) {
        const msgEl = document.createElement('div');
        msgEl.className = 'quick-message';
        msgEl.textContent = message;
        msgEl.tabIndex = 0;
        document.body.appendChild(msgEl);
        setTimeout(() => msgEl.focus(), 10);
        setTimeout(() => {
            msgEl.classList.add('fade-out');
            setTimeout(() => {
                if (msgEl.parentNode) {
                    msgEl.parentNode.removeChild(msgEl);
                }
            }, 500);
        }, 2000);
    }

    #closeOverlay(overlay, onClose) {
        if (overlay && overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
        }
        if (onClose) {
            onClose();
        }
    }

    #createKeyboardHandler(handler) {
        return event => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                handler();
            }
        };
    }

    #getChoiceClass(type) {
        switch (type) {
            case BUTTON_TYPES.DUNGEON:
                return 'choice-button dungeon-button';
            case BUTTON_TYPES.NEWLY_UNLOCKED:
                return 'choice-button newly-unlocked-button';
            default:
                return 'choice-button';
        }
    }

    #focusLocationHeading() {
        if (!this.locationNameEl) return;

        setTimeout(() => {
            // Skip if another overlay is in control of focus.
            if (document.querySelector('.dialog-overlay') || document.querySelector('.quick-message')) {
                return;
            }

            try {
                this.locationNameEl.focus({ preventScroll: true });
            } catch (error) {
                this.locationNameEl.focus();
            }
        }, 60);
    }
}

export { BUTTON_TYPES };
