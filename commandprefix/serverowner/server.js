const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'server',
    description: 'Informations complètes du serveur',
    ownerOnly: true,
    async execute(message, args, client) {
        // Vérifier si l'utilisateur est un owner
        if (!client.isOwner(message.author.id, message.guild.id) && !client.isDeveloper(message.author.id)) {
            console.log(`[SERVER ERROR] Permission refusée pour ${message.author.tag}`);
            return message.reply('Commande réservée aux owners du bot.');
        }        
        // Vérifier les permissions Discord (Administrateur requis)
        if (!client.isDeveloper(message.author.id) && !message.member.permissions.has('Administrator')) {
            console.log(`[SERVER ERROR] Permission Administrateur refusée pour ${message.author.tag}`);
            return message.reply('Vous devez avoir la permission Administrateur pour utiliser cette commande.');
        }
        
        const guild = message.guild;
        const embed = new EmbedBuilder()
            .setTitle(guild.name)
            .setThumbnail(guild.iconURL({ dynamic: true, size: 512 }))
            .addFields(
                { name: 'Membres', value: `${guild.memberCount}`, inline: true },
                { name: 'Channels', value: `${guild.channels.cache.size}`, inline: true },
                { name: 'Rôles', value: `${guild.roles.cache.size}`, inline: true },
                { name: 'Boosts', value: `${guild.premiumSubscriptionCount || 0}`, inline: true },
                { name: 'Niveau Boost', value: `${guild.premiumTier}`, inline: true },
                { name: 'Créé le', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true }
            )
            .setFooter({ text: `Owner: ${guild.ownerId}` })
            .setColor('0099FF');
        
        // Ajouter les informations sur la photo de profil et la bannière
        const iconField = guild.iconURL() 
            ? `[Voir l'icone](${guild.iconURL({ dynamic: true, size: 512 })})` 
            : 'Aucune icone';
        
        const bannerField = guild.bannerURL() 
            ? `[Voir la bannière](${guild.bannerURL({ dynamic: true, size: 512 })})` 
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
