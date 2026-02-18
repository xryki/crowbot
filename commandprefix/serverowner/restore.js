const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, EmbedBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
    name: 'restore',
    description: 'Restaure une sauvegarde de serveur',
    ownerOnly: true,
    async execute(message, args, client) {
        const prefix = client.getPrefix(message.guild.id);
        
        // Vérifier si l'utilisateur est un owner
        if (!client.isOwner(message.author.id, message.guild.id)) {
            return message.reply('Commande réservée aux owners du bot.');
        }        
        // Vérifier les permissions Discord (Administrateur requis)
        if (!message.member.permissions.has('Administrator')) {
            return message.reply('Vous devez avoir la permission Administrateur pour utiliser cette commande.');
        }
        
        const guild = message.guild;
        
        if (!args[0]) {
            // Lister les sauvegardes disponibles avec pagination
            const backupDir = './backups';
            if (!fs.existsSync(backupDir)) {
                return message.reply('Aucune sauvegarde trouvée.');
            }

            const files = fs.readdirSync(backupDir).filter(file => file.endsWith('.json'));
            if (files.length === 0) {
                return message.reply('Aucune sauvegarde trouvée.');
            }

            // Trier les fichiers par date de modification (plus récent en premier)
            const filesWithData = files.map(file => {
                const filePath = `${backupDir}/${file}`;
                const stats = fs.statSync(filePath);
                const backupData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
                return {
                    file,
                    filePath,
                    stats,
                    backupData
                };
            }).sort((a, b) => b.stats.mtime - a.stats.mtime);

            const itemsPerPage = 5;
            let currentPage = 0;
            const totalPages = Math.ceil(filesWithData.length / itemsPerPage);

            const generateEmbed = (page) => {
                const start = page * itemsPerPage;
                const end = start + itemsPerPage;
                const pageFiles = filesWithData.slice(start, end);

                let description = '';
                pageFiles.forEach((item, index) => {
                    const globalIndex = start + index + 1;
                    description += `**${globalIndex}. ${item.backupData.customName || item.backupData.serverInfo.name}**\n`;
                    description += `Fichier: \`${item.file}\`\n`;
                    description += `ID: \`${item.backupData.timestamp}\`\n`;
                    description += `Date: ${new Date(item.backupData.timestamp).toLocaleString('fr-FR')}\n`;
                    description += `Serveur: ${item.backupData.serverInfo.name}\n`;
                    description += `Membres: ${item.backupData.serverInfo.memberCount}\n`;
                    description += `Salons: ${item.backupData.channels.length}\n`;
                    if (item.backupData.roles) description += `Rôles: ${item.backupData.roles.length}\n`;
                    if (item.backupData.emojis) description += `Émojis: ${item.backupData.emojis.length}\n`;
                    if (item.backupData.stickers) description += `Autocollants: ${item.backupData.stickers.length}\n`;
                    description += '\n';
                });

                const embed = new EmbedBuilder()
                    .setTitle('Sauvegardes disponibles')
                    .setDescription(description)
                    .setColor('#0099FF')
                    .setFooter({ 
                        text: `Page ${page + 1}/${totalPages} | Total: ${filesWithData.length} sauvegardes` +
                               `\nPour restaurer: ${client.getPrefix(guild.id)}restore <fichier>, ${client.getPrefix(guild.id)}restore <timestamp> ou ${client.getPrefix(guild.id)}restore tout`
                    })
                    .setTimestamp();

                return embed;
            };

            const generateButtons = (page) => {
                const row = new ActionRowBuilder();
                
                // Bouton précédent
                const prevButton = new ButtonBuilder()
                    .setCustomId('prev')
                    .setLabel('◀️ Précédent')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(page === 0);
                
                // Bouton suivant
                const nextButton = new ButtonBuilder()
                    .setCustomId('next')
                    .setLabel('Suivant ▶️')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(page >= totalPages - 1);
                
                // Boutons de navigation rapide
                const firstButton = new ButtonBuilder()
                    .setCustomId('first')
                    .setLabel('⏮️')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(page === 0);
                
                const lastButton = new ButtonBuilder()
                    .setCustomId('last')
                    .setLabel('⏭️')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(page >= totalPages - 1);
                
                row.addComponents(firstButton, prevButton, nextButton, lastButton);
                
                return row;
            };

            // Envoyer le premier message
            const embedMessage = await message.reply({
                embeds: [generateEmbed(currentPage)],
                components: [generateButtons(currentPage)]
            });

            // Créer un collector pour les boutons
            const collector = embedMessage.createMessageComponentCollector({
                componentType: ComponentType.Button,
                time: 300000 // 5 minutes
            });

            collector.on('collect', async (interaction) => {
                if (interaction.user.id !== message.author.id) {
                    await interaction.reply({ 
                        content: 'Seul l\'auteur de la commande peut utiliser ces boutons.', 
                        ephemeral: true 
                    });
                    return;
                }

                switch (interaction.customId) {
                    case 'prev':
                        currentPage = Math.max(0, currentPage - 1);
                        break;
                    case 'next':
                        currentPage = Math.min(totalPages - 1, currentPage + 1);
                        break;
                    case 'first':
                        currentPage = 0;
                        break;
                    case 'last':
                        currentPage = totalPages - 1;
                        break;
                }

                await interaction.update({
                    embeds: [generateEmbed(currentPage)],
                    components: [generateButtons(currentPage)]
                });
            });

            collector.on('end', () => {
                // Désactiver les boutons à la fin du collector
                embedMessage.edit({
                    components: []
                }).catch(() => {});
            });

            return;
        }

        // Tenter de restaurer la sauvegarde
        const backupIdentifier = args[0];
        const backupDir = './backups';
        let backupFile = null;
        
        // Option "tout" pour restaurer automatiquement la sauvegarde la plus récente
        if (backupIdentifier === 'tout') {
            const files = fs.readdirSync(backupDir).filter(file => file.endsWith('.json'));
            if (files.length === 0) {
                return message.reply('Aucune sauvegarde trouvée.');
            }
            
            // Trouver la sauvegarde la plus récente
            let mostRecentFile = null;
            let mostRecentTime = 0;
            
            for (const file of files) {
                const filePath = `${backupDir}/${file}`;
                const stats = fs.statSync(filePath);
                if (stats.mtime > mostRecentTime) {
                    mostRecentTime = stats.mtime;
                    mostRecentFile = filePath;
                }
            }
            
            if (!mostRecentFile) {
                return message.reply('Aucune sauvegarde trouvée.');
            }
            
            backupFile = mostRecentFile;
        } else {
            // Chercher par nom de fichier
            if (backupIdentifier.endsWith('.json')) {
                if (fs.existsSync(`${backupDir}/${backupIdentifier}`)) {
                    backupFile = `${backupDir}/${backupIdentifier}`;
                }
            } else {
                // Chercher par timestamp
                const files = fs.readdirSync(backupDir).filter(file => file.endsWith('.json'));
                for (const file of files) {
                    const filePath = `${backupDir}/${file}`;
                    const backupData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
                    if (backupData.timestamp === backupIdentifier) {
                        backupFile = filePath;
                        break;
                    }
                }
            }

            if (!backupFile) {
                return message.reply(`Sauvegarde introuvable. Utilise \`${prefix}restore\` pour voir la liste des sauvegardes.`);
            }
        }

        try {
            const backup = JSON.parse(fs.readFileSync(backupFile, 'utf-8'));
            
            // Créer un salon temporaire pour les messages de restauration
            let restoreChannel;
            try {
                restoreChannel = await guild.channels.create({
                    name: 'restauration-backup',
                    type: 0, // GUILD_TEXT
                    permissionOverwrites: [{
                        id: guild.roles.everyone,
                        deny: ['ViewChannel'],
                        type: 0
                    }]
                });
            } catch (error) {
                console.error('Erreur création salon temporaire:', error);
                return message.reply('Impossible de créer un salon pour la restauration.');
            }
            
            await restoreChannel.send('**Restauration en cours**\nAttention: Cette action va modifier le serveur !');
            
            // Demander confirmation seulement si ce n'est pas l'option "tout"
            if (backupIdentifier !== 'tout') {
                await restoreChannel.send('**Confirmation requise**\nÊtes-vous sûr de vouloir continuer ? Répondez `oui` pour confirmer.');
                
                const confirmation = await restoreChannel.awaitMessages({
                    max: 1,
                    time: 30000,
                    errors: ['time']
                }).then(collected => {
                    const msg = collected.first();
                    return msg.content.toLowerCase();
                }).catch(() => 'non');

                if (!confirmation.includes('oui')) {
                    await restoreChannel.delete('Restauration annulée');
                    return message.reply('**Restauration annulée**');
                }
            } else {
                await restoreChannel.send('**Restauration automatique de la sauvegarde la plus récente**');
            }

            // Demander confirmation pour la suppression des rôles
            await restoreChannel.send('**Suppression des rôles existants**\nVoulez-vous supprimer tous les rôles existants (sauf @everyone et les rôles gérés par Discord) avant la restauration ? (oui/non)');
            
            const deleteRoles = await restoreChannel.awaitMessages({
                max: 1,
                time: 30000,
                errors: ['time']
            }).then(collected => {
                const msg = collected.first();
                return msg.content.toLowerCase();
            }).catch(() => 'non');

            // Demander confirmation pour la suppression des salons
            await restoreChannel.send('**Suppression des salons existants**\nVoulez-vous supprimer tous les salons existants avant la restauration ? (oui/non)');
            
            const deleteChannels = await restoreChannel.awaitMessages({
                max: 1,
                time: 30000,
                errors: ['time']
            }).then(collected => {
                const msg = collected.first();
                return msg.content.toLowerCase();
            }).catch(() => 'non');

            // Demander si on veut restaurer les rôles
            let restoreRoles = 'non';
            if (backup.roles && backup.roles.length > 0) {
                await restoreChannel.send(`**Restauration des rôles**\nLa sauvegarde contient ${backup.roles.length} rôles. Voulez-vous les ajouter au serveur ? (oui/non)`);
                
                restoreRoles = await restoreChannel.awaitMessages({
                    max: 1,
                    time: 30000,
                    errors: ['time']
                }).then(collected => {
                    const msg = collected.first();
                    return msg.content.toLowerCase();
                }).catch(() => 'non');
            }

            // Demander si on veut restaurer les salons
            let restoreChannels = 'non';
            if (backup.channels && backup.channels.length > 0) {
                await restoreChannel.send(`**Restauration des salons**\nLa sauvegarde contient ${backup.channels.length} salons. Voulez-vous les ajouter au serveur ? (oui/non)`);
                
                restoreChannels = await restoreChannel.awaitMessages({
                    max: 1,
                    time: 30000,
                    errors: ['time']
                }).then(collected => {
                    const msg = collected.first();
                    return msg.content.toLowerCase();
                }).catch(() => 'non');
            }

            // Demander si on veut restaurer les émojis
            let restoreEmojis = 'non';
            let deleteEmojis = 'non';
            if (backup.emojis && backup.emojis.length > 0) {
                await restoreChannel.send(`**Restauration des émojis**\nLa sauvegarde contient ${backup.emojis.length} émojis. Voulez-vous les ajouter au serveur ? (oui/non)`);
                
                restoreEmojis = await restoreChannel.awaitMessages({
                    max: 1,
                    time: 30000,
                    errors: ['time']
                }).then(collected => {
                    const msg = collected.first();
                    return msg.content.toLowerCase();
                }).catch(() => 'non');

                if (restoreEmojis.includes('oui')) {
                    await restoreChannel.send(`**Suppression des émojis existants**\nVoulez-vous supprimer les émojis actuels du serveur avant d'ajouter ceux de la sauvegarde ? (oui/non)`);
                    
                    deleteEmojis = await restoreChannel.awaitMessages({
                        max: 1,
                        time: 30000,
                        errors: ['time']
                    }).then(collected => {
                        const msg = collected.first();
                        return msg.content.toLowerCase();
                    }).catch(() => 'non');
                }
            }

            // Demander si on veut restaurer les autocollants
            let restoreStickers = 'non';
            let deleteStickers = 'non';
            if (backup.stickers && backup.stickers.length > 0) {
                await restoreChannel.send(`**Restauration des autocollants**\nLa sauvegarde contient ${backup.stickers.length} autocollants. Voulez-vous les ajouter au serveur ? (oui/non)`);
                
                restoreStickers = await restoreChannel.awaitMessages({
                    max: 1,
                    time: 30000,
                    errors: ['time']
                }).then(collected => {
                    const msg = collected.first();
                    return msg.content.toLowerCase();
                }).catch(() => 'non');

                if (restoreStickers.includes('oui')) {
                    await restoreChannel.send(`**Suppression des autocollants existants**\nVoulez-vous supprimer les autocollants actuels du serveur avant d'ajouter ceux de la sauvegarde ? (oui/non)`);
                    
                    deleteStickers = await restoreChannel.awaitMessages({
                        max: 1,
                        time: 30000,
                        errors: ['time']
                    }).then(collected => {
                        const msg = collected.first();
                        return msg.content.toLowerCase();
                    }).catch(() => 'non');
                }
            }

            // Demander confirmation finale pour restaurer la backup
            let finalMessage = `**Confirmation finale de la restauration**\n\nVous allez restaurer la sauvegarde: ${backup.customName || backup.serverInfo.name}\n\n**Actions prévues:**`;
            finalMessage += `\nSuppression des rôles: ${deleteRoles.includes('oui') ? 'Oui' : 'Non'}`;
            finalMessage += `\nSuppression des salons: ${deleteChannels.includes('oui') ? 'Oui' : 'Non'}`;
            finalMessage += `\nRestauration des rôles: ${restoreRoles.includes('oui') ? 'Oui' : 'Non'}`;
            finalMessage += `\nRestauration des salons: ${restoreChannels.includes('oui') ? 'Oui' : 'Non'}`;
            finalMessage += `\nRestauration des émojis: ${restoreEmojis.includes('oui') ? 'Oui' : 'Non'}`;
            if (restoreEmojis.includes('oui')) {
                finalMessage += `\nSuppression des émojis existants: ${deleteEmojis.includes('oui') ? 'Oui' : 'Non'}`;
            }
            finalMessage += `\nRestauration des autocollants: ${restoreStickers.includes('oui') ? 'Oui' : 'Non'}`;
            if (restoreStickers.includes('oui')) {
                finalMessage += `\nSuppression des autocollants existants: ${deleteStickers.includes('oui') ? 'Oui' : 'Non'}`;
            }
            finalMessage += `\n\n**Attention:** Cette action est **irréversible** !\n\nÊtes-vous absolument certain de vouloir continuer ? Répondez \`oui\` pour confirmer.`;
            
            await restoreChannel.send(finalMessage);
            
            const finalConfirmation = await restoreChannel.awaitMessages({
                max: 1,
                time: 30000,
                errors: ['time']
            }).then(collected => {
                const msg = collected.first();
                return msg.content.toLowerCase();
            }).catch(() => 'non');

            if (!finalConfirmation.includes('oui')) {
                await restoreChannel.delete('Restauration annulée');
                return message.reply('**Restauration annulée**');
            }

            // Supprimer tous les salons existants si confirmé
            if (deleteChannels.includes('oui')) {
                await restoreChannel.send('**Suppression des salons existants...**');
                
                const channelsToDelete = guild.channels.cache.filter(ch => ch.id !== restoreChannel.id);
                for (const channel of channelsToDelete.values()) {
                    try {
                        await channel.delete('Nettoyage avant restauration');
                    } catch (error) {
                        console.error(`Erreur suppression salon ${channel.name}:`, error);
                    }
                }
            }

            // Supprimer tous les rôles existants si confirmé
            if (deleteRoles.includes('oui')) {
                await restoreChannel.send('**Suppression des rôles existants...**');
                
                const rolesToDelete = guild.roles.cache.filter(role => role.name !== '@everyone' && role.managed !== true && role.id !== guild.id);
                let deletedCount = 0;
                let errorCount = 0;
                
                for (const role of rolesToDelete.values()) {
                    try {
                        await role.delete('Nettoyage avant restauration');
                        deletedCount++;
                    } catch (error) {
                        errorCount++;
                        console.error(`Erreur suppression rôle ${role.name} (${role.id}):`, error.message);
                    }
                }
                
                await restoreChannel.send(`**Suppression des rôles terminée**\nRôles supprimés: ${deletedCount} | Erreurs: ${errorCount}`);
            }

            // Restaurer le nom, l'icône et la bannière du serveur si disponibles
            await restoreChannel.send('**Application du nom, icône et bannière...**');
            
            try {
                if (backup.serverInfo.name) {
                    await guild.setName(backup.serverInfo.name);
                    await restoreChannel.send('Nom du serveur restauré');
                }
                if (backup.serverInfo.icon) {
                    await guild.setIcon(backup.serverInfo.icon);
                    await restoreChannel.send('Photo de profil restaurée');
                }
                if (backup.serverInfo.banner) {
                    await guild.setBanner(backup.serverInfo.banner);
                    await restoreChannel.send('Bannière restaurée');
                }
            } catch (error) {
                console.error('Erreur modification infos serveur:', error);
            }

            // Restaurer les rôles si confirmé
            if (backup.roles && restoreRoles.includes('oui')) {
                await restoreChannel.send('**Création des rôles en cours...**');
                
                for (const roleData of backup.roles) {
                    try {
                        await guild.roles.create({
                            name: roleData.name,
                            color: roleData.color,
                            position: roleData.position,
                            permissions: BigInt(roleData.permissions),
                            hoist: roleData.hoist,
                            mentionable: roleData.mentionable,
                            icon: roleData.icon,
                            unicodeEmoji: roleData.unicodeEmoji
                        });
                    } catch (error) {
                        console.error(`Erreur création rôle ${roleData.name}:`, error);
                    }
                }
            }

            // Restaurer les salons si confirmé
            if (backup.channels && restoreChannels.includes('oui')) {
                await restoreChannel.send('**Création des salons en cours...**');
                
                // Créer les catégories d'abord
                const categories = backup.channels.filter(ch => ch.type === 4);
                const categoryMap = new Map();
                
                for (const categoryData of categories) {
                    try {
                        const category = await guild.channels.create({
                            name: categoryData.name,
                            type: 4, // GUILD_CATEGORY
                            position: categoryData.position
                        });
                        categoryMap.set(categoryData.id, category.id);
                    } catch (error) {
                        console.error(`Erreur création catégorie ${categoryData.name}:`, error);
                    }
                }

                // Créer les autres salons
                for (const channelData of backup.channels) {
                    if (channelData.type === 4) continue; // Catégories déjà créées
                    
                    try {
                        const channelOptions = {
                            name: channelData.name,
                            type: channelData.type,
                            position: channelData.position,
                            topic: channelData.topic,
                            nsfw: channelData.nsfw,
                            rateLimitPerUser: channelData.rateLimitPerUser,
                            userLimit: channelData.userLimit,
                            bitrate: channelData.bitrate
                        };

                        // Ajouter la catégorie si elle existe
                        if (channelData.parentId && categoryMap.has(channelData.parentId)) {
                            channelOptions.parent = categoryMap.get(channelData.parentId);
                        }

                        const channel = await guild.channels.create(channelOptions);

                        // Restaurer les permissions
                        for (const perm of channelData.permissionOverwrites) {
                            try {
                                await channel.permissionOverwrites.create(perm.id, {
                                    allow: BigInt(perm.allow),
                                    deny: BigInt(perm.deny),
                                    type: perm.type
                                });
                            } catch (error) {
                                console.error(`Erreur permission salon ${channel.name}:`, error);
                            }
                        }
                    } catch (error) {
                        console.error(`Erreur création salon ${channelData.name}:`, error);
                    }
                }
            }

            // Gérer les émojis si confirmé
            if (backup.emojis && restoreEmojis.includes('oui')) {
                // Supprimer les émojis existants si demandé
                if (deleteEmojis.includes('oui')) {
                    await restoreChannel.send('**Suppression des émojis existants...**');
                    const existingEmojis = guild.emojis.cache;
                    for (const emoji of existingEmojis.values()) {
                        try {
                            await emoji.delete('Nettoyage avant restauration');
                        } catch (error) {
                            console.error(`Erreur suppression émoji ${emoji.name}:`, error);
                        }
                    }
                }
                
                // Ajouter les émojis de la sauvegarde
                await restoreChannel.send('**Ajout des émojis en cours...**');
                for (const emojiData of backup.emojis) {
                    try {
                        await guild.emojis.create({
                            attachment: emojiData.url,
                            name: emojiData.name
                        });
                    } catch (error) {
                        console.error(`Erreur création émoji ${emojiData.name}:`, error);
                    }
                }
            }

            // Gérer les autocollants si confirmé
            if (backup.stickers && restoreStickers.includes('oui')) {
                // Supprimer les autocollants existants si demandé
                if (deleteStickers.includes('oui')) {
                    await restoreChannel.send('**Suppression des autocollants existants...**');
                    const existingStickers = guild.stickers.cache;
                    for (const sticker of existingStickers.values()) {
                        try {
                            await sticker.delete('Nettoyage avant restauration');
                        } catch (error) {
                            console.error(`Erreur suppression autocollant ${sticker.name}:`, error);
                        }
                    }
                }
                
                // Ajouter les autocollants de la sauvegarde
                await restoreChannel.send('**Ajout des autocollants en cours...**');
                for (const stickerData of backup.stickers) {
                    try {
                        await guild.stickers.create({
                            file: stickerData.url,
                            name: stickerData.name,
                            description: stickerData.description,
                            tags: stickerData.tags
                        });
                    } catch (error) {
                        console.error(`Erreur création autocollant ${stickerData.name}:`, error);
                    }
                }
            }

            await restoreChannel.send(`**Restauration terminée**\nSauvegarde de ${backup.serverInfo.name} a été restaurée sur ${guild.name}`);
            
            // Rendre le salon visible à la fin
            setTimeout(async () => {
                try {
                    await restoreChannel.permissionOverwrites.edit(guild.roles.everyone, { ViewChannel: true });
                    await restoreChannel.setName('restauration-terminée');
                } catch (error) {
                    console.error('Erreur modification salon final:', error);
                }
            }, );

        } catch (error) {
            console.error('Erreur lors de la restauration:', error);
            try {
                await message.channel.send('**Erreur lors de la restauration**\nUne erreur est survenue lors de la restauration.');
            } catch (e) {
                console.error('Impossible d\'envoyer le message d\'erreur:', e);
            }
        }
    }
};
