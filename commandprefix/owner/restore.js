const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const fs = require('fs');

module.exports = {
    name: 'restore',
    description: 'Restaure une sauvegarde de serveur',
    ownerOnly: true,
    async execute(message, args, client) {
        // Vérifier si l'utilisateur est un owner
        if (!client.isOwner(message.author.id, message.guild.id)) {
            return message.reply('Commande réservée aux owners du bot.');
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
                               `\nPour restaurer: ${client.getPrefix(guild.id)}restore <fichier> ou ${client.getPrefix(guild.id)}restore <timestamp>`
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
            return message.reply('Sauvegarde introuvable. Utilise `!restore` pour voir la liste des sauvegardes.');
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
            
            const startEmbed = new EmbedBuilder()
                .setTitle('🔄 Restauration en cours')
                .setDescription('Attention: Cette action va modifier le serveur !')
                .setColor('#FFA500')
                .setTimestamp();
            
            await restoreChannel.send({ embeds: [startEmbed] });
            
            // Demander confirmation
            const confirmEmbed = new EmbedBuilder()
                .setTitle('⚠️ Confirmation requise')
                .setDescription('Êtes-vous sûr de vouloir continuer ? Répondez `oui` pour confirmer.')
                .setColor('#FF0000')
                .setTimestamp();
            
            await restoreChannel.send({ embeds: [confirmEmbed] });
            
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
                const cancelEmbed = new EmbedBuilder()
                    .setTitle('❌ Restauration annulée')
                    .setColor('#FF0000')
                    .setTimestamp();
                return message.reply({ embeds: [cancelEmbed] });
            }

            // Supprimer tous les salons existants
            const deleteChannelsEmbed = new EmbedBuilder()
                .setTitle('🗑️ Suppression des salons existants...')
                .setColor('#FFA500')
                .setTimestamp();
            
            await restoreChannel.send({ embeds: [deleteChannelsEmbed] });
            
            const channelsToDelete = guild.channels.cache.filter(ch => ch.id !== restoreChannel.id);
            for (const channel of channelsToDelete.values()) {
                try {
                    await channel.delete('Nettoyage avant restauration');
                } catch (error) {
                    console.error(`Erreur suppression salon ${channel.name}:`, error);
                }
            }

            // Supprimer tous les rôles existants (sauf @everyone)
            const deleteRolesEmbed = new EmbedBuilder()
                .setTitle('🗑️ Suppression des rôles existants...')
                .setColor('#FFA500')
                .setTimestamp();
            
            await restoreChannel.send({ embeds: [deleteRolesEmbed] });
            
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
            
            const rolesCountEmbed = new EmbedBuilder()
                .setTitle('📊 Suppression des rôles terminée')
                .setDescription(`Rôles supprimés: ${deletedCount} | Erreurs: ${errorCount}`)
                .setColor('#00FF00')
                .setTimestamp();
            
            await restoreChannel.send({ embeds: [rolesCountEmbed] });

            // Restaurer le nom, l'icône et la bannière du serveur
            const serverInfoEmbed = new EmbedBuilder()
                .setTitle('⚙️ Application du nom, icône et bannière...')
                .setColor('#FFA500')
                .setTimestamp();
            
            await restoreChannel.send({ embeds: [serverInfoEmbed] });
            
            try {
                await guild.setName(backup.serverInfo.name);
                if (backup.serverInfo.icon) {
                    await guild.setIcon(backup.serverInfo.icon);
                }
                if (backup.serverInfo.banner) {
                    await guild.setBanner(backup.serverInfo.banner);
                }
            } catch (error) {
                console.error('Erreur modification infos serveur:', error);
            }

            // Restaurer les rôles si disponibles
            if (backup.roles) {
                const createRolesEmbed = new EmbedBuilder()
                    .setTitle('🎭 Création des rôles en cours...')
                    .setColor('#FFA500')
                    .setTimestamp();
                
                await restoreChannel.send({ embeds: [createRolesEmbed] });
                
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

            // Restaurer les salons
            const createChannelsEmbed = new EmbedBuilder()
                .setTitle('📝 Création des salons en cours...')
                .setColor('#FFA500')
                .setTimestamp();
            
            await restoreChannel.send({ embeds: [createChannelsEmbed] });
            
            // Créer les catégories d'abord
            const categories = backup.channels.filter(ch => ch.type === 0);
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
                if (channelData.type === 0) continue; // Catégories déjà créées
                
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

            const completeEmbed = new EmbedBuilder()
                .setTitle('✅ Restauration terminée')
                .setDescription(`Sauvegarde de ${backup.serverInfo.name} a été restaurée sur ${guild.name}`)
                .setColor('#00FF00')
                .setTimestamp();
            
            await restoreChannel.send({ embeds: [completeEmbed] });
            
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
                const errorEmbed = new EmbedBuilder()
                    .setTitle('❌ Erreur lors de la restauration')
                    .setDescription('Une erreur est survenue lors de la restauration.')
                    .setColor('#FF0000')
                    .setTimestamp();
                
                await message.channel.send({ embeds: [errorEmbed] });
            } catch (e) {
                console.error('Impossible d\'envoyer le message d\'erreur:', e);
            }
        }
    }
};
