const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType, StringSelectMenuBuilder } = require('discord.js');

class GiveawayHandler {
    constructor(client) {
        this.client = client;
        this.giveaways = new Map(); // Stocke les giveaways actifs
        this.participants = new Map(); // Stocke les participants par giveaway
        
        // Initialiser le stockage
        if (!client.giveaways) {
            client.giveaways = new Map();
        }
        if (!client.giveawayParticipants) {
            client.giveawayParticipants = new Map();
        }
    }

    // Convertir la durée en millisecondes
    parseDuration(durationStr) {
        const match = durationStr.match(/^(\d+)([hjm])$/);
        if (!match) return null;
        
        const [, amount, unit] = match;
        const value = parseInt(amount);
        
        switch (unit) {
            case 'h': return value * 60 * 60 * 1000; // heures
            case 'm': return value * 60 * 1000; // minutes
            case 'j': return value * 24 * 60 * 60 * 1000; // jours
            default: return null;
        }
    }

    // Formater la durée restante
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
                    name: '⏰ Temps restant', 
                    value: timeLeft, 
                    inline: true 
                },
                { 
                    name: '👥 Participants', 
                    value: participants.size.toString(), 
                    inline: true 
                },
                { 
                    name: '🏆 Gagnants', 
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

            // Vérifier si l'utilisateur est admin pour afficher les boutons admin
            const isAdmin = interaction.member ? interaction.member.permissions.has('Administrator') : false;
            const buttons = this.createGiveawayButtons({ messageId: 'temp' }, isAdmin);

            // Envoyer le giveaway sans boutons admin pour éviter l'erreur
            const channel = await this.client.channels.fetch(giveawayData.channelId);
            const message = await channel.send({ embeds: [embed] });

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

            // Mettre à jour l'embed sans boutons pour éviter l'erreur
            const updatedEmbed = this.createGiveawayEmbed(finalGiveawayData);
            await message.edit({ embeds: [updatedEmbed] });

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
            if (!giveaway) {
                return await interaction.reply({ content: 'Giveaway introuvable', ephemeral: true });
            }

            if (giveaway.endTime < Date.now()) {
                return await interaction.reply({ content: 'Ce giveaway est terminé', ephemeral: true });
            }

            const participants = this.participants.get(messageId) || new Set();
            
            if (participants.has(interaction.user.id)) {
                participants.delete(interaction.user.id);
                await interaction.reply({ content: 'Tu ne participes plus à ce giveaway', ephemeral: true });
            } else {
                participants.add(interaction.user.id);
                await interaction.reply({ content: 'Tu participes maintenant à ce giveaway !', ephemeral: true });
            }

            // Mettre à jour le compteur
            await this.updateGiveawayEmbed(messageId);

        } catch (error) {
            console.error('Erreur participation giveaway:', error);
        }
    }

    // Mettre à jour l'embed du giveaway
    async updateGiveawayEmbed(messageId) {
        try {
            const giveaway = this.giveaways.get(messageId);
            const participants = this.participants.get(messageId);
            
            if (!giveaway) return;

            const channel = await this.client.channels.fetch(giveaway.channelId);
            const message = await channel.messages.fetch(messageId);
            
            const embed = this.createGiveawayEmbed({
                ...giveaway,
                endTime: giveaway.endTime
            });

            await message.edit({ embeds: [embed] });

        } catch (error) {
            console.error('Erreur mise à jour embed:', error);
        }
    }

    // Démarrer le compte à rebours
    startCountdown(messageId) {
        const giveaway = this.giveaways.get(messageId);
        if (!giveaway) return;

        const updateInterval = setInterval(async () => {
            const currentGiveaway = this.giveaways.get(messageId);
            if (!currentGiveaway) {
                clearInterval(updateInterval);
                return;
            }

            if (currentGiveaway.endTime <= Date.now()) {
                clearInterval(updateInterval);
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
                const embed = new EmbedBuilder()
                    .setColor('#FF4B4B')
                    .setTitle('🎉 Giveaway Terminé')
                    .setDescription(`**${giveaway.title}**\n\n❌ Personne n\'a participé à ce giveaway`)
                    .setThumbnail('https://i.imgur.com/3VxBx1f.png')
                    .setFooter({ text: 'Giveaway terminé sans participants' })
                    .setTimestamp();

                await message.edit({ embeds: [embed], components: [] });
            } else {
                // Tirer au sort les gagnants
                const winnersArray = Array.from(participants);
                const selectedWinners = this.selectWinners(winnersArray, giveaway.winners);

                const embed = new EmbedBuilder()
                    .setColor('#4BFF4B')
                    .setTitle('🎉 Giveaway Terminé')
                    .setDescription(`**${giveaway.title}**\n\n🎊 Félicitations aux gagnants !`)
                    .setThumbnail('https://i.imgur.com/3VxBx1f.png')
                    .addFields(
                        { 
                            name: '🏆 Gagnants', 
                            value: selectedWinners.map(w => `<@${w}>`).join('\n'), 
                            inline: false 
                        },
                        { 
                            name: '📊 Statistiques', 
                            value: `**${participants.size}** participants au total`, 
                            inline: false 
                        }
                    )
                    .setFooter({ text: `Giveaway ID: ${messageId} • Terminé avec succès` })
                    .setTimestamp();

                await message.edit({ embeds: [embed], components: [] });

                // Annoncer les gagnants
                await channel.send({
                    content: `🎊 **Félicitations ${selectedWinners.map(w => `<@${w}>`).join(', ')} !**\n\nVous avez gagné **${giveaway.title}** ! 🎁`
                });
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
                .setTitle('🔧 Modifier le Giveaway')
                .setDescription('Choisis ce que tu veux modifier en répondant à ce message :')
                .addFields(
                    { name: '🎁 Gain actuel', value: giveaway.title, inline: false },
                    { name: '📝 Description actuelle', value: giveaway.description, inline: false },
                    { name: '⏰ Temps restant', value: this.formatTime(giveaway.endTime - Date.now()), inline: false },
                    { name: '🏆 Gagnants actuels', value: giveaway.winners.toString(), inline: false }
                )
                .addFields(
                    { name: 'Comment modifier ?', value: 
                        '• `title [nouveau titre]`\n' +
                        '• `description [nouvelle description]`\n' +
                        '• `time [durée supplémentaire]`\n' +
                        '• `winners [nombre]`', 
                        inline: false 
                    }
                )
                .setFooter({ text: `Giveaway ID: ${messageId}` })
                .setTimestamp();

            await message.reply({ embeds: [embed] });

            // Stocker l'attente de modification
            if (!this.client.giveawayModifyWaiting) this.client.giveawayModifyWaiting = new Map();
            this.client.giveawayModifyWaiting.set(message.author.id, messageId);

        } catch (error) {
            console.error('Erreur affichage formulaire modification:', error);
        }
    }
    async handleModify(interaction, messageId) {
        try {
            const giveaway = this.giveaways.get(messageId);
            if (!giveaway) {
                return await interaction.reply({ content: 'Giveaway introuvable', ephemeral: true });
            }

            // Créer l'embed de modification
            const embed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('Modifier le Giveaway')
                .setDescription('Choisis ce que tu veux modifier :')
                .addFields(
                    { name: '🎁 Gain actuel', value: giveaway.title, inline: false },
                    { name: '📝 Description actuelle', value: giveaway.description, inline: false },
                    { name: '⏰ Durée actuelle', value: `${Math.floor((giveaway.endTime - Date.now()) / 60000)} minutes restantes`, inline: false },
                    { name: '🏆 Gagnants actuels', value: giveaway.winners.toString(), inline: false }
                );

            // Créer les boutons de modification
            const buttons = [
                new ButtonBuilder()
                    .setCustomId(`gw_edit_title_${messageId}`)
                    .setLabel('Modifier le gain')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`gw_edit_desc_${messageId}`)
                    .setLabel('Modifier la description')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`gw_edit_time_${messageId}`)
                    .setLabel('Modifier la durée')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`gw_edit_winners_${messageId}`)
                    .setLabel('Modifier les gagnants')
                    .setStyle(ButtonStyle.Primary)
            ];

            const row = new ActionRowBuilder().addComponents(buttons);

            await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });

        } catch (error) {
            console.error('Erreur modification giveaway:', error);
        }
    }

    // Gérer l'édition spécifique
    async handleEdit(interaction, messageId, editType) {
        try {
            const editMessages = {
                title: 'Envoie le nouveau gain du giveaway :',
                description: 'Envoie la nouvelle description du giveaway :',
                time: 'Envoie la nouvelle durée (ex: 1h, 30m, 3j) :',
                winners: 'Envoie le nouveau nombre de gagnants :'
            };

            await interaction.reply({ 
                content: editMessages[editType], 
                ephemeral: true 
            });

            // Stocker l'attente d'édition
            if (!this.client.giveawayEditWaiting) this.client.giveawayEditWaiting = new Map();
            this.client.giveawayEditWaiting.set(interaction.user.id, { messageId, editType });

        } catch (error) {
            console.error('Erreur édition giveaway:', error);
        }
    }

    // Appliquer la modification
    async applyEdit(userId, newContent) {
        try {
            const waitingData = this.client.giveawayEditWaiting.get(userId);
            if (!waitingData) return;

            const { messageId, editType } = waitingData;
            const giveaway = this.giveaways.get(messageId);
            if (!giveaway) return;

            // Appliquer la modification
            switch (editType) {
                case 'title':
                    giveaway.title = newContent;
                    break;
                case 'description':
                    giveaway.description = newContent;
                    break;
                case 'time':
                    const additionalTime = this.parseDuration(newContent);
                    if (additionalTime) {
                        giveaway.endTime += additionalTime;
                    } else {
                        return 'Durée invalide !';
                    }
                    break;
                case 'winners':
                    const winners = parseInt(newContent);
                    if (!isNaN(winners) && winners > 0) {
                        giveaway.winners = winners;
                    } else {
                        return 'Nombre de gagnants invalide !';
                    }
                    break;
            }

            // Mettre à jour l'embed sans boutons pour éviter l'erreur
            const channel = await this.client.channels.fetch(giveaway.channelId);
            const message = await channel.messages.fetch(messageId);
            const embed = this.createGiveawayEmbed(giveaway);
            await message.edit({ embeds: [embed] });

            // Nettoyer
            this.client.giveawayEditWaiting.delete(userId);
            
            return 'Modification appliquée avec succès !';

        } catch (error) {
            console.error('Erreur application modification:', error);
            return 'Erreur lors de la modification';
        }
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
    // Traiter les commandes de modification
    async processModifyCommand(userId, messageId, content) {
        try {
            const giveaway = this.giveaways.get(messageId);
            if (!giveaway) {
                this.client.giveawayModifyWaiting.delete(userId);
                return 'Giveaway introuvable.';
            }

            const parts = content.trim().split(' ');
            if (parts.length < 2) {
                return 'Format incorrect ! Utilise: `title [nouveau titre]`, `description [nouvelle description]`, etc.';
            }

            const command = parts[0].toLowerCase();
            const newValue = parts.slice(1).join(' ');

            switch (command) {
                case 'title':
                    giveaway.title = newValue;
                    break;
                case 'description':
                    giveaway.description = newValue;
                    break;
                case 'time':
                    const additionalTime = this.parseDuration(newValue);
                    if (additionalTime) {
                        giveaway.endTime += additionalTime;
                    } else {
                        return 'Durée invalide ! Utilise le format: 1h, 30m, 3j';
                    }
                    break;
                case 'winners':
                    const winners = parseInt(newValue);
                    if (!isNaN(winners) && winners > 0) {
                        giveaway.winners = winners;
                    } else {
                        return 'Nombre de gagnants invalide !';
                    }
                    break;
                default:
                    return 'Commande inconnue ! Utilise: `title`, `description`, `time` ou `winners`';
            }

            // Mettre à jour l'embed
            const channel = await this.client.channels.fetch(giveaway.channelId);
            const message = await channel.messages.fetch(messageId);
            const embed = this.createGiveawayEmbed(giveaway);
            await message.edit({ embeds: [embed] });

            // Nettoyer
            this.client.giveawayModifyWaiting.delete(userId);
            
            return `✅ ${command.charAt(0).toUpperCase() + command.slice(1)} modifié avec succès !`;

        } catch (error) {
            console.error('Erreur traitement commande modification:', error);
            return 'Erreur lors de la modification.';
        }
    }
}

module.exports = GiveawayHandler;
