const fs = require('fs');

module.exports = {
    name: 'backup',
    description: 'Crée une sauvegarde complète du serveur',
    ownerOnly: true,
    async execute(message, args, client) {
        // Vérifier si l'utilisateur est owner (global ou serveur)
        if (!client.isOwner(message.author.id, message.guild.id)) {
            return message.reply('Commande réservée aux owners du bot.');
        }
        
        const guild = message.guild;
        
        // Vérifier si un nom de backup est fourni
        const customName = args.join(' ');
        
        // Demander confirmation pour les éléments optionnels
        await message.reply('Sauvegarde du Serveur\n\nQuels éléments voulez-vous sauvegarder ?\n\n**Options disponibles :**\n- `roles` : Rôles et couleurs\n- `emojis` : Émojis du serveur\n- `stickers` : Autocollants du serveur\n\nRépondez par `oui` ou `non` pour chaque option.');

        // Poser les questions
        const questions = [
            { key: 'roles', text: 'Voulez-vous sauvegarder les rôles et couleurs ? (oui/non)' },
            { key: 'emojis', text: 'Voulez-vous sauvegarder les émojis du serveur ? (oui/non)' },
            { key: 'stickers', text: 'Voulez-vous sauvegarder les autocollants du serveur ? (oui/non)' }
        ];

        const options = {};
        
        for (const question of questions) {
            await message.channel.send(question.text);
            
            const response = await message.channel.awaitMessages({
                max: 1,
                time: 30000,
                errors: ['time']
            }).then(collected => {
                const msg = collected.first();
                return msg.content.toLowerCase();
            }).catch(() => 'non');

            options[question.key] = response.includes('oui');
        }

        await message.channel.send('🔄 **Création de la sauvegarde en cours...**');

        try {
            const backup = {
                timestamp: new Date().toISOString(),
                customName: customName || `backup_${guild.name}`,
                serverInfo: {
                    name: guild.name,
                    icon: guild.iconURL(),
                    banner: guild.bannerURL(),
                    description: guild.description,
                    ownerId: guild.ownerId,
                    memberCount: guild.memberCount,
                    createdAt: guild.createdAt.toISOString()
                },
                channels: [],
                roles: options.roles ? [] : null,
                emojis: options.emojis ? [] : null,
                stickers: options.stickers ? [] : null
            };

            // Sauvegarder les salons
            const channels = guild.channels.cache;
            for (const channel of channels.values()) {
                const channelData = {
                    id: channel.id,
                    name: channel.name,
                    type: channel.type,
                    position: channel.position,
                    parentId: channel.parentId,
                    topic: channel.topic,
                    nsfw: channel.nsfw,
                    rateLimitPerUser: channel.rateLimitPerUser,
                    userLimit: channel.userLimit,
                    bitrate: channel.bitrate,
                    permissionOverwrites: []
                };

                // Sauvegarder les permissions du salon
                if (channel.permissionOverwrites) {
                    for (const [id, overwrite] of channel.permissionOverwrites.cache) {
                        channelData.permissionOverwrites.push({
                            id: id,
                            type: overwrite.type,
                            allow: overwrite.allow.bitfield.toString(),
                            deny: overwrite.deny.bitfield.toString()
                        });
                    }
                }

                backup.channels.push(channelData);
            }

            // Sauvegarder les rôles si demandé
            if (options.roles) {
                const roles = guild.roles.cache;
                for (const role of roles.values()) {
                    if (role.name !== '@everyone') {
                        backup.roles.push({
                            id: role.id,
                            name: role.name,
                            color: role.color,
                            position: role.position,
                            permissions: role.permissions.bitfield.toString(),
                            hoist: role.hoist,
                            mentionable: role.mentionable,
                            icon: role.iconURL(),
                            unicodeEmoji: role.unicodeEmoji
                        });
                    }
                }
            }

            // Sauvegarder les émojis si demandé
            if (options.emojis) {
                const emojis = guild.emojis.cache;
                for (const emoji of emojis.values()) {
                    backup.emojis.push({
                        id: emoji.id,
                        name: emoji.name,
                        animated: emoji.animated,
                        url: emoji.url
                    });
                }
            }

            // Sauvegarder les autocollants si demandé
            if (options.stickers) {
                const stickers = guild.stickers.cache;
                for (const sticker of stickers.values()) {
                    backup.stickers.push({
                        id: sticker.id,
                        name: sticker.name,
                        description: sticker.description,
                        tags: sticker.tags,
                        formatType: sticker.formatType,
                        url: sticker.url
                    });
                }
            }

            // Créer le dossier de sauvegarde s'il n'existe pas
            const backupDir = './backups';
            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir);
            }

            // Sauvegarder en JSON
            const filename = customName ? `${customName.replace(/[^a-zA-Z0-9]/g, '_')}.json` : `backup_${guild.id}_${Date.now()}.json`;
            fs.writeFileSync(`${backupDir}/${filename}`, JSON.stringify(backup, null, 2));

            // Créer un résumé en texte brut
            let summary = `Sauvegarde terminée\n\nSauvegarde du serveur **${guild.name}** créée avec succès !\n\n**Nom**: ${backup.customName}\n**Fichier**: \`${filename}\`\n**Salons**: ${backup.channels.length}\n**Membres**: ${backup.serverInfo.memberCount}`;
            
            if (options.roles && backup.roles) {
                summary += `\n**Rôles**: ${backup.roles.length}`;
            }
            if (options.emojis && backup.emojis) {
                summary += `\n**Émojis**: ${backup.emojis.length}`;
            }
            if (options.stickers && backup.stickers) {
                summary += `\n**Autocollants**: ${backup.stickers.length}`;
            }

            await message.channel.send(summary);

        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            await message.channel.send('Une erreur est survenue lors de la création de la sauvegarde.');
        }
    }
};
