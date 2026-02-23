const { PermissionsBitField, ChannelType } = require('discord.js');

module.exports = {
    name: 'renew',
    description: 'Supprime et recrée un salon avec les mêmes permissions, nom et position',
    permissions: PermissionsBitField.Flags.ManageChannels,
    async execute(message, args, client) {
        // Vérifier les permissions de l'utilisateur - bypass pour le développeur
        console.log(`[RENEW] Vérification permissions - Auteur: ${message.author.id}, Est développeur: ${client.isDeveloper ? client.isDeveloper(message.author.id) : 'FONCTION INEXISTANTE'}`);
        
        if (!client.isDeveloper(message.author.id) && !message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            console.log(`[RENEW ERROR] Permission refusée pour ${message.author.tag}`);
            return message.reply('Tu n\'as pas la permission "ManageChannels" pour utiliser cette commande.');
        }
        

        const channel = message.channel;
        const guild = message.guild;
        
        // Vérifier si c'est un salon textuel ou vocal
        if (!channel.isTextBased() && channel.type !== ChannelType.GuildVoice) {
            return message.reply('Cette commande ne fonctionne que sur les salons textuels ou vocaux.');
        }
        
        // Sauvegarder les propriétés essentielles du salon
        const channelData = {
            name: channel.name,
            type: channel.type,
            position: channel.position,
            topic: channel.topic,
            nsfw: channel.nsfw,
            rateLimitPerUser: channel.rateLimitPerUser,
            parent: channel.parent,
            permissionOverwrites: [],
            bitrate: channel.bitrate,
            userLimit: channel.userLimit
        };
        
        // Sauvegarder toutes les permissions
        channel.permissionOverwrites.cache.forEach((overwrite, targetId) => {
            channelData.permissionOverwrites.push({
                targetId: targetId,
                type: overwrite.type,
                allow: overwrite.allow.toArray(),
                deny: overwrite.deny.toArray()
            });
        });
        
        try {
            // Supprimer le salon
            await channel.delete('Renew - Recréation du salon');
            
            // Recréer le salon
            let newChannel;
            
            if (channelData.type === ChannelType.GuildText) {
                newChannel = await guild.channels.create({
                    name: channelData.name,
                    type: ChannelType.GuildText,
                    position: channelData.position,
                    topic: channelData.topic,
                    nsfw: channelData.nsfw,
                    rateLimitPerUser: channelData.rateLimitPerUser,
                    parent: channelData.parent
                });
            } else if (channelData.type === ChannelType.GuildVoice) {
                newChannel = await guild.channels.create({
                    name: channelData.name,
                    type: ChannelType.GuildVoice,
                    position: channelData.position,
                    bitrate: channelData.bitrate,
                    userLimit: channelData.userLimit,
                    parent: channelData.parent
                });
            }
            
            // Appliquer les permissions
            if (channelData.permissionOverwrites.length > 0) {
                for (const permissionData of channelData.permissionOverwrites) {
                    try {
                        await newChannel.permissionOverwrites.create(permissionData.targetId, {
                            allow: permissionData.allow,
                            deny: permissionData.deny,
                            type: permissionData.type
                        });
                    } catch (permError) {
                        console.error(`Erreur permission pour ${permissionData.targetId}:`, permError);
                    }
                }
            }
            
            // Message de confirmation avec ping qui se supprime
            try {
                const confirmationMessage = await newChannel.send(`Salon recréé ${message.author.toString()}`);
                setTimeout(() => {
                    confirmationMessage.delete().catch(() => {});
                }, 3000);
            } catch (error) {
                console.error('Erreur message confirmation:', error);
            }
            
        } catch (error) {
            console.error('Erreur renew:', error);
            return; // Message d'erreur silencieux
        }
    }
};
