const { PermissionsBitField, ChannelType } = require('discord.js');

module.exports = {
    name: 'renew',
    description: 'Supprime et recrée un salon avec les mêmes permissions, nom et position',
    permissions: PermissionsBitField.Flags.ManageChannels,
    async execute(message, args, client) {
        const channel = message.channel;
        const guild = message.guild;
        
        // Vérifier si c'est un salon textuel ou vocal
        if (!channel.isTextBased() && channel.type !== ChannelType.GuildVoice) {
            return message.reply('Cette commande ne fonctionne que sur les salons textuels ou vocaux.');
        }
        
        // Sauvegarder les propriétés du salon
        const channelData = {
            name: channel.name,
            type: channel.type,
            position: channel.position,
            topic: channel.topic,
            nsfw: channel.nsfw,
            rateLimitPerUser: channel.rateLimitPerUser,
            parent: channel.parent,
            permissionOverwrites: channel.permissionOverwrites.cache,
            bitrate: channel.bitrate,
            userLimit: channel.userLimit
        };
        
        try {
            // Attendre seulement  seconde au lieu de 
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Supprimer le salon
            await channel.delete('Renew - Recréation du salon');
            
            // Recréer le salon avec les mêmes propriétés
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
            
            // Appliquer les permissions (attendre que tout soit appliqué)
            if (channelData.permissionOverwrites.size > 0) {
                console.log(`Application de ${channelData.permissionOverwrites.size} permissions sur ${newChannel.name}`);
                
                for (const [targetId, overwrite] of channelData.permissionOverwrites) {
                    try {
                        await newChannel.permissionOverwrites.create(targetId, {
                            allow: overwrite.allow.toArray(),
                            deny: overwrite.deny.toArray(),
                            type: overwrite.type
                        });
                        console.log(`Permission appliquée pour ${targetId}: allow=${overwrite.allow.toArray()}, deny=${overwrite.deny.toArray()}`);
                    } catch (permError) {
                        console.error(`Erreur permission pour ${targetId}:`, permError);
                    }
                }
                
                // Vérification finale que les permissions sont correctes
                await new Promise(resolve => setTimeout(resolve, 100));
                const finalPermissions = newChannel.permissionOverwrites.cache;
                console.log(`Permissions finales sur ${newChannel.name}: ${finalPermissions.size} overwrites`);
            } else {
                console.log(`Aucune permission à appliquer sur ${newChannel.name}`);
            }
            
            // Message de confirmation rapide avec ping qui s'auto-supprime après . secondes
            try {
                const confirmationMessage = await newChannel.send(`Salon recréé avec succès ! ${message.author.toString()}`);
                setTimeout(async () => {
                    try {
                        await confirmationMessage.delete().catch(() => {});
                    } catch (error) {
                        // Ignorer si déjà supprimé
                    }
                }, );
            } catch (error) {
                console.error('Erreur message confirmation:', error);
            }
            
        } catch (error) {
            console.error('Erreur renew:', error);
            message.reply('Une erreur est survenue lors de la recréation du salon. Vérifiez que j\'ai les permissions nécessaires.');
        }
    }
};
