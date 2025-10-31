export class StorageService {
    constructor(storageKey = 'vivid_game_save') {
        this.storageKey = storageKey;
    }

    load() {
        try {
            const raw = localStorage.getItem(this.storageKey);
            return raw ? JSON.parse(raw) : null;
        } catch (error) {
            console.error('Failed to load save data:', error);
            return null;
        }
    }

    save(data) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(data));
        } catch (error) {
            console.error('Failed to save game:', error);
        }
    }

    clear() {
        try {
            localStorage.removeItem(this.storageKey);
        } catch (error) {
            console.error('Failed to delete save data:', error);
        }
    }
}
