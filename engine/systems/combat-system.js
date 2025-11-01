import { BUTTON_TYPES } from '../ui/ui-manager.js';

export class CombatSystem {
    constructor(state, ui, audio, gameData, { onVictory, onDefeat, onStateChange }) {
        this.state = state;
        this.ui = ui;
        this.audio = audio;
        this.gameData = gameData;
        this.onVictory = onVictory;
        this.onDefeat = onDefeat;
        this.onStateChange = onStateChange;
        this.currentCombat = null;
    }

    startEncounter(monsterName) {
        const monsterTemplate = this.gameData.Monsters?.[monsterName];
        if (!monsterTemplate) {
            console.error(`Monster not found: ${monsterName}`);
            return;
        }

        this.currentCombat = {
            monster: {
                Name: monsterName,
                CurrentHealth: monsterTemplate.Health,
                TotalHealth: monsterTemplate.Health,
                Strength: monsterTemplate.Strength || 10,
                Toughness: monsterTemplate.Toughness || 5,
                Skills: monsterTemplate.Skills || [],
                Weakness: monsterTemplate.Weakness,
                Gold: monsterTemplate.Gold || 0,
                ExperiencePoints: monsterTemplate.ExperiencePoints || 0
            },
            turn: 'player'
        };

        this.render();
    }

    render() {
        if (!this.currentCombat) return;

        const { monster } = this.currentCombat;
        const partyStatus = this.state.party.map(member => (
            `<strong>${member.Name}</strong>: ${member.CurrentHealth}/${member.TotalHealth} HP, ${member.CurrentSkillPoints}/${member.TotalSkillPoints} SP`
        ));

        this.ui.showCombatStatus({
            monsterName: monster.Name,
            monsterHealth: { current: Math.max(0, monster.CurrentHealth), total: monster.TotalHealth },
            partyStatus
        });

        if (this.currentCombat.turn === 'player') {
            const choices = this.#buildPlayerChoices();
            this.ui.renderChoices(choices);
        }
    }

    #buildPlayerChoices() {
        const choices = [];
        this.state.party.forEach((member, index) => {
            if (member.CurrentHealth <= 0) {
                return;
            }

            choices.push({
                label: `${member.Name}: Attack`,
                onSelect: () => this.#handleAttack(index),
                type: BUTTON_TYPES.NORMAL
            });

            if (Array.isArray(member.Skills)) {
                member.Skills.forEach(skillName => {
                    const skill = this.gameData.Skills?.[skillName];
                    if (!skill) {
                        return;
                    }
                    const canUse = (member.CurrentSkillPoints || 0) >= (skill.Cost || 0);
                    choices.push({
                        label: `${member.Name}: ${skillName} (${skill.Cost || 0} SP)`,
                        onSelect: () => this.#handleSkill(index, skillName),
                        type: BUTTON_TYPES.NORMAL,
                        disabled: !canUse
                    });
                });
            }
        });
        return choices;
    }

    #handleAttack(memberIndex) {
        if (!this.currentCombat) return;
        this.ui.disableChoices();

        const member = this.state.party[memberIndex];
        const monster = this.currentCombat.monster;
        const damage = Math.max(1, (member.Strength || 0) - (monster.Toughness || 0));
        monster.CurrentHealth -= damage;
        
        // Play attack sound effect
        this.#playAttackSound(member.Name);
        
        this.ui.showQuickMessage(`${member.Name} attacks for ${damage} damage!`);

        setTimeout(() => this.#nextTurn(), 900);
    }

    #handleSkill(memberIndex, skillName) {
        if (!this.currentCombat) return;

        const member = this.state.party[memberIndex];
        const skill = this.gameData.Skills?.[skillName];
        if (!skill) {
            return;
        }

        if ((member.CurrentSkillPoints || 0) < (skill.Cost || 0)) {
            this.ui.showQuickMessage('Not enough SP!');
            return;
        }

        this.ui.disableChoices();
        member.CurrentSkillPoints -= skill.Cost || 0;
        const monster = this.currentCombat.monster;

        // Play skill sound effect
        this.#playSkillSound(skillName);

        if (skill.Target === 'SingleFriend') {
            const healAmount = Math.floor((member.Special || 0) * (skill.DamageMultiplier || 1));
            member.CurrentHealth = Math.min(member.TotalHealth || 0, (member.CurrentHealth || 0) + healAmount);
            this.ui.showQuickMessage(`${member.Name} uses ${skillName} and heals ${healAmount} HP!`);
        } else {
            let damage = Math.floor(((member.Strength || 0) + (member.Special || 0)) * (skill.DamageMultiplier || 1));

            if (skill.DamageType && skill.DamageType === monster.Weakness) {
                damage = Math.floor(damage * 1.5);
                this.ui.showQuickMessage(`It's super effective!`);
            }

            damage = Math.max(1, damage - (monster.Toughness || 0));
            monster.CurrentHealth -= damage;
            this.ui.showQuickMessage(`${member.Name} uses ${skillName} for ${damage} damage!`);
        }

        setTimeout(() => this.#nextTurn(), 1200);
    }

    #nextTurn() {
        if (!this.currentCombat) return;

        const monster = this.currentCombat.monster;
        if (monster.CurrentHealth <= 0) {
            this.#handleVictory();
            return;
        }

        const aliveMembers = this.state.party.filter(m => (m.CurrentHealth || 0) > 0);
        if (aliveMembers.length === 0) {
            this.#handleDefeat();
            return;
        }

        if (this.currentCombat.turn === 'player') {
            this.currentCombat.turn = 'monster';
            setTimeout(() => this.#monsterTurn(), 800);
        } else {
            this.currentCombat.turn = 'player';
            this.render();
        }
    }

    #monsterTurn() {
        if (!this.currentCombat) return;

        const monster = this.currentCombat.monster;
        const aliveMembers = this.state.party.filter(m => (m.CurrentHealth || 0) > 0);
        if (aliveMembers.length === 0) {
            this.#handleDefeat();
            return;
        }

        const target = aliveMembers[Math.floor(Math.random() * aliveMembers.length)];
        const damage = Math.max(1, (monster.Strength || 0) - (target.Toughness || 0));
        target.CurrentHealth -= damage;
        
        // Play monster sound effect
        this.#playMonsterSound(monster.Name);
        
        this.ui.showQuickMessage(`${monster.Name} attacks ${target.Name} for ${damage} damage!`);

        setTimeout(() => {
            const stillAlive = this.state.party.some(m => (m.CurrentHealth || 0) > 0);
            if (!stillAlive) {
                this.#handleDefeat();
            } else {
                this.currentCombat.turn = 'player';
                this.render();
            }
        }, 1000);
    }

    #handleVictory() {
        if (!this.currentCombat) return;

        const monster = this.currentCombat.monster;
        this.currentCombat = null;
        this.onVictory(monster);
    }

    #handleDefeat() {
        this.currentCombat = null;
        this.onDefeat();
    }

    #playAttackSound(characterName) {
        // Try character-specific sound first, fall back to generic attack
        const charSound = `audio/sfx/attacks/${characterName.toLowerCase().replace(/\s+/g, '-')}.wav`;
        const genericSound = 'audio/sfx/attacks/attack.wav';
        
        // Attempt to play, will silently fail if file doesn't exist (browser handles this)
        this.audio.playSoundEffect(charSound, {
            onComplete: null
        });
    }

    #playSkillSound(skillName) {
        const skillSound = `audio/sfx/skills/${skillName.toLowerCase().replace(/\s+/g, '-')}.wav`;
        this.audio.playSoundEffect(skillSound);
    }

    #playMonsterSound(monsterName) {
        const monsterSound = `audio/sfx/monsters/${monsterName.toLowerCase().replace(/\s+/g, '-')}.wav`;
        this.audio.playSoundEffect(monsterSound);
    }
}
