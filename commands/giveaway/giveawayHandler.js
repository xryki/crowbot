const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType, StringSelectMenuBuilder } = require('discord.js');

class GiveawayHandler {
    constructor(client) {
        this.client = client;
        this.giveaways = new Map();
        this.participants = new Map();
    }

    // Parser la durée (ex: 1h, 30m, 3j)
    parseDuration(durationStr) {
        const match = durationStr.match(/^(\d+)([hmsj])$/);
        if (!match) return null;

        const [, amount, unit] = match;
        const time = parseInt(amount);

        switch (unit) {
            case 's': return time * 1000;
            case 'm': return time * 60 * 1000;
            case 'h': return time * 60 * 60 * 1000;
            case 'j': return time * 24 * 60 * 60 * 1000;
            default: return null;
        }
    }

    // Formater le temps
    formatTime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}j ${hours % 24}h`;
        if (hours > 0) return `${hours}h ${minutes % 60}m`;
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
    }

    // Créer l'embed du giveaway
    createGiveawayEmbed(giveawayData) {
        const participants = this.participants.get(giveawayData.messageId) || new Set();
        const timeLeft = this.formatTime(giveawayData.endTime - Date.now());
        
        const embed = new EmbedBuilder()
            .setColor('#5865F2') // Bleu Discord
            .setTitle(`${giveawayData.title}`)
            .setDescription(`${giveawayData.description}`)
            .addFields(
                { 
                    name: 'Temps restant', 
                    value: timeLeft, 
                    inline: true 
                },
                { 
                    name: 'Participants', 
                    value: participants.size.toString(), 
                    inline: true 
                },
                { 
                    name: 'Gagnants', 
                    value: giveawayData.winners.toString(), 
                    inline: true 
                }
            )
            .setFooter({ text: `Giveaway ID: ${giveawayData.messageId}` })
            .setTimestamp();

        return embed;
    }

    // Créer les boutons du giveaway
    createGiveawayButtons(giveawayData, isAdmin = false) {
        const buttons = [];
        
        // Bouton participer pour tout le monde
        const participateButton = new ButtonBuilder()
            .setCustomId(`gw_participate_${giveawayData.messageId}`)
            .setLabel('Participer')
            .setStyle(ButtonStyle.Success);

        buttons.push(participateButton);
        
        // Boutons admin seulement si c'est l'admin
        if (isAdmin) {
            const modifyButton = new ButtonBuilder()
                .setCustomId(`gw_modify_${giveawayData.messageId}`)
                .setLabel('Modifier')
                .setStyle(ButtonStyle.Primary);

            const endButton = new ButtonBuilder()
                .setCustomId(`gw_end_${giveawayData.messageId}`)
                .setLabel('Terminer')
                .setStyle(ButtonStyle.Danger);

            buttons.push(modifyButton, endButton);
        }

        // Retourner une seule row avec tous les boutons (max 5 boutons)
        return [new ActionRowBuilder().addComponents(buttons)];
    }

    // Démarrer un giveaway
    async startGiveaway(interaction, giveawayData) {
        try {
            const duration = this.parseDuration(giveawayData.duration);
            if (!duration) {
                return await interaction.reply({ content: 'Durée invalide ! Utilise le format: 1h, 30m, 3j', ephemeral: true });
            }

            const winners = parseInt(giveawayData.winners);
            if (isNaN(winners) || winners < 1) {
                return await interaction.reply({ content: 'Nombre de gagnants invalide !', ephemeral: true });
            }

            // Créer l'embed et les boutons
            const embed = this.createGiveawayEmbed({
                ...giveawayData,
                endTime: Date.now() + duration,
                messageId: 'temp' // Sera remplacé après l'envoi
            });

            // Envoyer le giveaway dans le salon spécifié avec le bouton participer
            const channel = await this.client.channels.fetch(giveawayData.channelId);
            const buttons = this.createGiveawayButtons({ messageId: 'temp' }, false); // false = pas admin
            const message = await channel.send({ embeds: [embed], components: buttons });

            // Stocker les données du giveaway
            const finalGiveawayData = {
                ...giveawayData,
                endTime: Date.now() + duration,
                winners: winners,
                messageId: message.id,
                channelId: message.channel.id,
                guildId: message.guild.id,
                hostId: interaction.user ? interaction.user.id : message.author.id
            };

            this.giveaways.set(message.id, finalGiveawayData);
            this.participants.set(message.id, new Set());
            
            // Sauvegarder dans le client
            this.client.giveaways.set(message.id, finalGiveawayData);
            this.client.giveawayParticipants.set(message.id, new Set());

            // Mettre à jour l'embed avec les boutons et le bon messageId
            const updatedEmbed = this.createGiveawayEmbed(finalGiveawayData);
            const updatedButtons = this.createGiveawayButtons(finalGiveawayData, false); // false = pas admin
            await message.edit({ embeds: [updatedEmbed], components: updatedButtons });

            // Démarrer le compte à rebours
            this.startCountdown(message.id);

            await interaction.reply({ content: `Giveaway créé dans ${channel} !`, ephemeral: false });

        } catch (error) {
            console.error('Erreur création giveaway:', error);
            try {
                await interaction.reply({ content: 'Erreur lors de la création du giveaway', ephemeral: false });
            } catch (replyError) {
                console.error('Impossible de répondre à l\'interaction:', replyError);
            }
        }
    }

    // Gérer la participation
    async handleParticipation(interaction, messageId) {
        try {
            const giveaway = this.giveaways.get(messageId);
            if (!giveaway || giveaway.endTime < Date.now()) {
                return await interaction.reply({ content: 'Giveaway terminé ou introuvable', ephemeral: true });
            }

            const participants = this.participants.get(messageId) || new Set();
            
            if (participants.has(interaction.user.id)) {
                participants.delete(interaction.user.id);
            } else {
                participants.add(interaction.user.id);
            }

            // Mettre à jour le compteur sans message de confirmation
            await this.updateGiveawayEmbed(messageId);
            
            // Acknowledge l'interaction silencieusement
            await interaction.deferUpdate();

        } catch (error) {
            console.error('Erreur participation giveaway:', error);
        }
    }

    // Mettre à jour l'embed du giveaway
    async updateGiveawayEmbed(messageId) {
        try {
            const giveaway = this.giveaways.get(messageId);
            if (!giveaway) return;

            const channel = await this.client.channels.fetch(giveaway.channelId);
            const message = await channel.messages.fetch(messageId);
            
            const embed = this.createGiveawayEmbed(giveaway);
            await message.edit({ embeds: [embed] });

        } catch (error) {
            console.error('Erreur mise à jour embed:', error);
        }
    }

    // Démarrer le compte à rebours
    startCountdown(messageId) {
        const interval = setInterval(async () => {
            const giveaway = this.giveaways.get(messageId);
            if (!giveaway) {
                clearInterval(interval);
                return;
            }

            if (giveaway.endTime <= Date.now()) {
                clearInterval(interval);
                await this.endGiveaway(messageId);
                return;
            }

            await this.updateGiveawayEmbed(messageId);
        }, 5000); // Mettre à jour toutes les 5 secondes
    }

    // Terminer un giveaway
    async endGiveaway(messageId) {
        try {
            const giveaway = this.giveaways.get(messageId);
            const participants = this.participants.get(messageId);
            
            if (!giveaway) return;

            const channel = await this.client.channels.fetch(giveaway.channelId);
            const message = await channel.messages.fetch(messageId);

            if (participants.size === 0) {
                await message.edit({ 
                    content: `**${giveaway.title}** - Personne n'a participé à ce giveaway`,
                    components: [] 
                });
            } else {
                // Tirer au sort les gagnants
                const winnersArray = Array.from(participants);
                const selectedWinners = this.selectWinners(winnersArray, giveaway.winners);

                // Supprimer l'embed du giveaway
                try {
                    await message.delete();
                } catch (error) {
                    // Le message a déjà été supprimé, on continue
                    console.log(`Message giveaway ${messageId} déjà supprimé`);
                }

                // Envoyer un message simple de félicitations pour chaque gagnant
                for (const winner of selectedWinners) {
                    await channel.send({
                        content: `Félicitations <@${winner}> !`
                    });
                }
            }

            // Nettoyer
            this.giveaways.delete(messageId);
            this.participants.delete(messageId);
            this.client.giveaways.delete(messageId);
            this.client.giveawayParticipants.delete(messageId);

        } catch (error) {
            console.error('Erreur fin giveaway:', error);
        }
    }

    // Afficher le formulaire de modification
    async showModifyForm(message, messageId) {
        try {
            const giveaway = this.giveaways.get(messageId);
            if (!giveaway) {
                return await message.reply('Giveaway introuvable.');
            }

            // Créer l'embed de modification
            const embed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('Modifier le Giveaway')
                .setDescription('Choisis ce que tu veux modifier en répondant à ce message :')
                .addFields(
                    { name: 'Gain actuel', value: giveaway.title, inline: false },
                    { name: 'Description actuelle', value: giveaway.description, inline: false },
                    { name: 'Temps restant', value: this.formatTime(giveaway.endTime - Date.now()), inline: false },
                    { name: 'Gagnants actuels', value: giveaway.winners.toString(), inline: false }
                )
                .addFields(
                    { name: 'Comment modifier ?', value: 
                        '• `title [nouveau titre]`\n' +
                        '• `description [nouvelle description]`\n' +
                        '• `time [durée supplémentaire]`\n' +
                        '• `winners [nombre]`\n\n' +
                        '**Modifications multiples :**\n' +
                        '`title Nouveau titre | description Nouvelle description | time 30m`\n' +
                        '`title Nitro | winners 3 | time 1h`', 
                        inline: false 
                    }
                )
                .addFields(
                    { name: 'Mode rapide', value: 'Fais plusieurs modifications en une seule ligne avec `|` comme séparateur !', inline: false }
                )
                .setFooter({ text: `Giveaway ID: ${messageId} • Tape "fin" pour terminer` })
                .setTimestamp();

            await message.reply({ embeds: [embed] });

            // Stocker l'attente de modification
            if (!this.client.giveawayModifyWaiting) this.client.giveawayModifyWaiting = new Map();
            this.client.giveawayModifyWaiting.set(message.author.id, messageId);

        } catch (error) {
            console.error('Erreur affichage formulaire modification:', error);
        }
    }

    // Traiter les commandes de modification
    async processModifyCommand(userId, messageId, content) {
        try {
            const giveaway = this.giveaways.get(messageId);
            if (!giveaway) {
                this.client.giveawayModifyWaiting.delete(userId);
                return 'Giveaway introuvable.';
            }

            // Vérifier si l'utilisateur veut terminer
            if (content.toLowerCase().trim() === 'fin') {
                this.client.giveawayModifyWaiting.delete(userId);
                return 'Session de modification terminée !';
            }

            let modifications = [];
            let errors = [];

            // Vérifier si c'est une modification multiple (avec |)
            if (content.includes('|')) {
                const modificationsList = content.split('|').map(m => m.trim());
                
                for (const mod of modificationsList) {
                    const result = this.parseSingleModification(mod);
                    if (result.success) {
                        modifications.push(result);
                    } else {
                        errors.push(`${mod}: ${result.error}`);
                    }
                }
            } else {
                // Modification simple
                const result = this.parseSingleModification(content);
                if (result.success) {
                    modifications.push(result);
                } else {
                    errors.push(result.error);
                }
            }

            // Appliquer les modifications réussies
            let appliedModifs = [];
            for (const mod of modifications) {
                switch (mod.command) {
                    case 'title':
                        giveaway.title = mod.value;
                        appliedModifs.push('Titre');
                        break;
                    case 'description':
                        giveaway.description = mod.value;
                        appliedModifs.push('Description');
                        break;
                    case 'time':
                        const additionalTime = this.parseDuration(mod.value);
                        if (additionalTime) {
                            giveaway.endTime += additionalTime;
                            appliedModifs.push('Durée');
                        }
                        break;
                    case 'winners':
                        const winners = parseInt(mod.value);
                        if (!isNaN(winners) && winners > 0) {
                            giveaway.winners = winners;
                            appliedModifs.push('Gagnants');
                        }
                        break;
                }
            }

            // Mettre à jour l'embed avec les boutons si des modifications ont été appliquées
            if (appliedModifs.length > 0) {
                const channel = await this.client.channels.fetch(giveaway.channelId);
                const message = await channel.messages.fetch(messageId);
                const embed = this.createGiveawayEmbed(giveaway);
                const buttons = this.createGiveawayButtons(giveaway, false); // false = pas admin
                await message.edit({ embeds: [embed], components: buttons });
            }

            // Construire le message de réponse
            let response = '';
            if (appliedModifs.length > 0) {
                response += `Modifications appliquées : ${appliedModifs.join(', ')}\n`;
            }
            if (errors.length > 0) {
                response += `Erreurs : ${errors.join(' | ')}`;
            }
            
            if (!response) {
                response = 'Aucune modification appliquée.';
            }

            // Garder l'utilisateur en mode modification pour permettre d'autres changements
            return response;

        } catch (error) {
            console.error('Erreur traitement commande modification:', error);
            return 'Erreur lors de la modification.';
        }
    }

    // Parser une seule modification
    parseSingleModification(content) {
        const parts = content.trim().split(' ');
        if (parts.length < 2) {
            return { success: false, error: 'Format incorrect' };
        }

        const command = parts[0].toLowerCase();
        const value = parts.slice(1).join(' ');

        const validCommands = ['title', 'description', 'time', 'winners'];
        if (!validCommands.includes(command)) {
            return { success: false, error: 'Commande inconnue' };
        }

        // Validation spécifique
        if (command === 'winners') {
            const winners = parseInt(value);
            if (isNaN(winners) || winners < 1) {
                return { success: false, error: 'Nombre de gagnants invalide' };
            }
        }

        if (command === 'time') {
            if (!this.parseDuration(value)) {
                return { success: false, error: 'Durée invalide (ex: 1h, 30m, 3j)' };
            }
        }

        return { success: true, command, value };
    }

    // Sélectionner les gagnants
    selectWinners(participants, count) {
        const shuffled = [...participants].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, Math.min(count, participants.length));
    }

    // Reroll un giveaway terminé
    async rerollGiveaway(messageId, channel) {
        try {
            const giveaway = this.giveaways.get(messageId);
            const participants = this.participants.get(messageId);
            
            if (!giveaway) {
                return await channel.send('Giveaway introuvable.');
            }

            if (!participants || participants.size === 0) {
                return await channel.send('Aucun participant pour ce giveaway.');
            }

            // Sélectionner de nouveaux gagnants
            const winnersArray = Array.from(participants);
            const selectedWinners = this.selectWinners(winnersArray, giveaway.winners);

            // Envoyer les nouveaux gagnants
            await channel.send({
                content: `Nouveaux gagnants pour **${giveaway.title}** : ${selectedWinners.map(w => `<@${w}>`).join(', ')} !`
            });

        } catch (error) {
            console.error('Erreur reroll giveaway:', error);
            await channel.send('Erreur lors du reroll du giveaway.');
        }
    }
}

module.exports = GiveawayHandler;
