const { EmbedBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
    name: 'restore',
    description: 'Restaure une sauvegarde de serveur',
    ownerOnly: true,
    async execute(message, args, client) {
        // Vérifier si l'utilisateur est owner (global ou serveur)
        if (!client.isOwner(message.author.id, message.guild.id)) {
            return message.reply('Commande réservée aux owners du bot.');
        }
        
        const guild = message.guild;
        
        if (!args[0]) {
            // Lister les sauvegardes disponibles
            const backupDir = './backups';
            if (!fs.existsSync(backupDir)) {
                return message.reply('Aucune sauvegarde trouvée.');
            }

            const files = fs.readdirSync(backupDir).filter(file => file.endsWith('.json'));
            if (files.length === 0) {
                return message.reply('Aucune sauvegarde trouvée.');
            }

            let response = '';
            
            for (const file of files) {
                const filePath = `${backupDir}/${file}`;
                const stats = fs.statSync(filePath);
                const backupData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                
                response += `**${file}**\n`;
                response += `Nom: ${backupData.customName || backupData.serverInfo.name}\n`;
                response += `ID: ${backupData.timestamp}\n`;
                response += `Date: ${new Date(backupData.timestamp).toLocaleString('fr-FR')}\n`;
                response += `Serveur: ${backupData.serverInfo.name}\n`;
                response += `Membres: ${backupData.serverInfo.memberCount}\n`;
                response += `Salons: ${backupData.channels.length}\n`;
                if (backupData.roles) response += `Rôles: ${backupData.roles.length}\n`;
                if (backupData.emojis) response += `Émojis: ${backupData.emojis.length}\n`;
                if (backupData.stickers) response += `Autocollants: ${backupData.stickers.length}\n`;
                response += '\n';
            }

            const embed = new EmbedBuilder()
                .setTitle('Sauvegardes disponibles')
                .setDescription(response)
                .setColor('#FFFFFF')
                .setTimestamp()
                .setFooter({ text: `Pour restaurer: ${client.getPrefix(guild.id)}restore <fichier> ou ${client.getPrefix(guild.id)}restore <timestamp>` });
            
            if (response.length > 2000) {
                // Si trop long, envoyer en fichier
                fs.writeFileSync('./backups_list.txt', response);
                await message.reply({
                    embeds: [new EmbedBuilder()
                        .setTitle('Sauvegardes disponibles')
                        .setDescription('Liste trop longue, voir fichier attaché')
                        .setColor('#FFFFFF')
                        .setTimestamp()],
                    files: ['./backups_list.txt']
                });
            } else {
                await message.reply({ embeds: [embed] });
            }
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
                const backupData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
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
            const backup = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
            
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
            
            await restoreChannel.send('Restauration en cours...\n\nAttention: Cette action va modifier le serveur !');
            
            // Demander confirmation
            await restoreChannel.send('Êtes-vous sûr de vouloir continuer ? Répondez `oui` pour confirmer.');
            
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
                return message.reply('Restauration annulée.');
            }

            // Supprimer tous les salons existants
            await restoreChannel.send('Suppression des salons existants...');
            
            const channelsToDelete = guild.channels.cache.filter(ch => ch.id !== restoreChannel.id);
            for (const channel of channelsToDelete.values()) {
                try {
                    await channel.delete('Nettoyage avant restauration');
                } catch (error) {
                    console.error(`Erreur suppression salon ${channel.name}:`, error);
                }
            }

            // Supprimer tous les rôles existants (sauf @everyone)
            await restoreChannel.send('Suppression des rôles existants...');
            
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
            
            await restoreChannel.send(`Rôles supprimés: ${deletedCount} | Erreurs: ${errorCount}`);

            // Restaurer le nom, l'icône et la bannière du serveur
            await restoreChannel.send('Application du nom, icône et bannière...');
            
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
                await restoreChannel.send('Création des rôles en cours...');
                
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
            await restoreChannel.send('Création des salons en cours...');
            
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

            await restoreChannel.send(`Sauvegarde de **${backup.serverInfo.name}** a été restaurée sur **${guild.name}**`);
            
            // Rendre le salon visible à la fin
            setTimeout(async () => {
                try {
                    await restoreChannel.permissionOverwrites.edit(guild.roles.everyone, { ViewChannel: true });
                    await restoreChannel.setName('restauration-terminée');
                } catch (error) {
                    console.error('Erreur modification salon final:', error);
                }
            }, 2000);

        } catch (error) {
            console.error('Erreur lors de la restauration:', error);
            try {
                await message.channel.send('Une erreur est survenue lors de la restauration.');
            } catch (e) {
                console.error('Impossible d\'envoyer le message d\'erreur:', e);
            }
        }
    }
};
