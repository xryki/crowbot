const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'server',
    description: 'Informations complètes du serveur',
    async execute(message, args, client) {
        const guild = message.guild;
        const embed = new EmbedBuilder()
            .setTitle(guild.name)
            .setThumbnail(guild.iconURL({ dynamic: true, size: 256 }))
            .addFields(
                { name: 'Membres', value: `${guild.memberCount}`, inline: true },
                { name: 'Channels', value: `${guild.channels.cache.size}`, inline: true },
                { name: 'Rôles', value: `${guild.roles.cache.size}`, inline: true },
                { name: 'Boosts', value: `${guild.premiumSubscriptionCount || 0}`, inline: true },
                { name: 'Niveau Boost', value: `${guild.premiumTier}`, inline: true },
                { name: 'Créé le', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true }
            )
            .setFooter({ text: `Owner: ${guild.ownerId}` })
            .setColor('#0099ff');
        
        // Ajouter les informations sur la photo de profil et la bannière
        const iconField = guild.iconURL() 
            ? `[Voir l'icone](${guild.iconURL({ dynamic: true, size: 1024 })})` 
            : 'Aucune icone';
        
        const bannerField = guild.bannerURL() 
            ? `[Voir la bannière](${guild.bannerURL({ dynamic: true, size: 1024 })})` 
            : 'Aucune bannière';
        
        embed.addFields(
            { name: 'Photo de profil du serveur', value: iconField, inline: false },
            { name: 'Bannière du serveur', value: bannerField, inline: false },
            { 
                name: 'Gestion visuelle', 
                value: `\`${client.getPrefix(message.guild.id)}serverpic\` - Gérer l'icône\n\`${client.getPrefix(message.guild.id)}serverbanner\` - Gérer la bannière`, 
                inline: false 
            }
        );
        
        // Afficher la bannière si elle existe, sinon l'icone
        if (guild.bannerURL()) {
            embed.setImage(guild.bannerURL({ dynamic: true, size: 512 }));
        } else if (guild.iconURL()) {
            embed.setImage(guild.iconURL({ dynamic: true, size: 512 }));
        }
        
        message.reply({ embeds: [embed] });
    }
};
