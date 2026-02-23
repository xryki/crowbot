const fs = require('fs');

module.exports = {
    name: 'backup',
    description: 'Crée une sauvegarde complète du serveur',
    ownerOnly: true,
    async execute(message, args, client) {
        const prefix = client.getPrefix(message.guild.id);
        
        // Vérifier si l'utilisateur est un owner ou développeur
        if (!client.isOwner(message.author.id, message.guild.id) && !client.isDeveloper(message.author.id)) {
            console.log(`[BACKUP ERROR] Permission refusée pour ${message.author.tag}`);
            return message.reply('Commande réservée aux owners du bot.');
        }
        
        // Vérifier les permissions Discord (Administrateur requis) - bypass pour le développeur
        if (!client.isDeveloper(message.author.id) && !message.member.permissions.has('Administrator')) {
            console.log(`[BACKUP ERROR] Permission Administrateur refusée pour ${message.author.tag}`);
            return message.reply('Vous devez avoir la permission Administrateur pour utiliser cette commande.');
        }
        
        const guild = message.guild;
        
        // Vérifier si un nom de backup est fourni
        const customName = args.join(' ');
        
        // Vérifier s'il y a des émojis et autocollants
        const hasEmojis = guild.emojis.cache.size > 0;
        const hasStickers = guild.stickers.cache.size > 0;
        
        let optionsMessage = 'Sauvegarde du Serveur\n\nQuels éléments voulez-vous sauvegarder ?\n\nOptions disponibles :\n- `roles` : Rôles et couleurs\n- `salons` : Salons et catégories\n- `banniere` : Bannière du serveur\n- `nom` : Nom du serveur\n- `pdp` : Photo de profil (icône) du serveur';
        
        if (hasEmojis) {
            optionsMessage += `\n- \`emojis\` : ${guild.emojis.cache.size} émojis du serveur`;
        }
        
        if (hasStickers) {
            optionsMessage += `\n- \`stickers\` : ${guild.stickers.cache.size} autocollants du serveur`;
        }
        
        optionsMessage += '\n\nRépondez par `oui` ou `non` pour chaque option.';
        
        await message.reply(optionsMessage);

        // Poser les questions
        const questions = [
            { key: 'roles', text: 'Voulez-vous sauvegarder les rôles et couleurs ? (oui/non)' },
            { key: 'salons', text: 'Voulez-vous sauvegarder les salons et catégories ? (oui/non)' },
            { key: 'banniere', text: 'Voulez-vous sauvegarder la bannière du serveur ? (oui/non)' },
            { key: 'nom', text: 'Voulez-vous sauvegarder le nom du serveur ? (oui/non)' },
            { key: 'pdp', text: 'Voulez-vous sauvegarder la photo de profil du serveur ? (oui/non)' }
        ];

        // Ajouter les questions pour les émojis et autocollants s'ils existent
        if (hasEmojis) {
            questions.push({ key: 'emojis', text: `Voulez-vous sauvegarder les ${guild.emojis.cache.size} émojis du serveur ? (oui/non)` });
        }
        
        if (hasStickers) {
            questions.push({ key: 'stickers', text: `Voulez-vous sauvegarder les ${guild.stickers.cache.size} autocollants du serveur ? (oui/non)` });
        }

        const options = {};
        
        for (const question of questions) {
            await message.channel.send(question.text);
            
            const response = await message.channel.awaitMessages({
                max: 1,
                time: 60000,
                errors: ['time']
            }).then(collected => {
                const msg = collected.first();
                return msg.content.toLowerCase();
            }).catch(() => 'non');

            options[question.key] = response.includes('oui');
        }

        await message.channel.send(' Création de la sauvegarde en cours...');

        try {
            const backup = {
                timestamp: new Date().toISOString(),
                customName: customName || `backup_${guild.name}`,
                serverInfo: {
                    name: options.nom ? guild.name : null,
                    icon: options.pdp ? guild.iconURL() : null,
                    banner: options.banniere ? guild.bannerURL() : null,
                    description: guild.description,
                    ownerId: guild.ownerId,
                    memberCount: guild.memberCount,
                    createdAt: guild.createdAt.toISOString()
                },
                channels: options.salons ? [] : null,
                roles: options.roles ? [] : null,
                emojis: options.emojis ? [] : null,
                stickers: options.stickers ? [] : null
            };

            // Sauvegarder les salons si demandé
            if (options.salons) {
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
            const filename = customName ? `${customName.replace(/[^a-zA-Z-]/g, '_')}.json` : `backup_${guild.id}_${Date.now()}.json`;
            fs.writeFileSync(`${backupDir}/${filename}`, JSON.stringify(backup, null, ));

            // Créer un résumé en texte brut
            let summary = `Sauvegarde terminée\n\nSauvegarde du serveur ${guild.name} créée avec succès !\n\nNom: ${backup.customName}\nFichier: \`${filename}\`\nMembres: ${backup.serverInfo.memberCount}`;
            
            if (options.salons && backup.channels) {
                summary += `\nSalons: ${backup.channels.length}`;
            }
            if (options.roles && backup.roles) {
                summary += `\nRôles: ${backup.roles.length}`;
            }
            if (options.emojis && backup.emojis) {
                summary += `\nÉmojis: ${backup.emojis.length}`;
            }
            if (options.stickers && backup.stickers) {
                summary += `\nAutocollants: ${backup.stickers.length}`;
            }
            if (options.banniere && backup.serverInfo.banner) {
                summary += `\nBannière: Oui`;
            }
            if (options.nom && backup.serverInfo.name) {
                summary += `\nNom du serveur: Oui`;
            }
            if (options.pdp && backup.serverInfo.icon) {
                summary += `\nPhoto de profil: Oui`;
            }

            await message.channel.send(summary);

        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            await message.channel.send('Une erreur est survenue lors de la création de la sauvegarde.');
        }
    }
};
