const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'banner',
    description: 'Affiche les bannières profil principal et serveur d\'un utilisateur',
    async execute(message, args, client) {
        const user = message.mentions.users.first() || message.author;
        
        // Récupérer les données complètes de l'utilisateur pour Nitro
        const fetchedUser = await client.users.fetch(user.id, { force: true });
        const member = message.guild.members.cache.get(user.id);
        
        const embed = new EmbedBuilder()
            .setTitle(`Bannières de ${fetchedUser.username}`)
            .setColor('FFFFFF')
            .setDescription(`Voici les bannières de ${fetchedUser.username} :`);
        
        // Bannière principale du profil (Nitro)
        const mainBanner = fetchedUser.bannerURL({ dynamic: true, size: 512 });
        if (mainBanner) {
            embed.addFields({ 
                name: 'Bannière principale (Nitro)', 
                value: `[Télécharger en HD](${mainBanner})`, 
                inline: false 
            });
            embed.setImage(mainBanner);
        } else {
            embed.addFields({ 
                name: 'Bannière principale (Nitro)', 
                value: 'Aucune (Nitro requis)', 
                inline: false 
            });
        }
        
        // Bannière du serveur pour cet utilisateur
        const serverBanner = member && member.bannerURL({ dynamic: true, size: 512 });
        if (serverBanner) {
            embed.addFields({ 
                name: 'Bannière du serveur', 
                value: `[Télécharger en HD](${serverBanner})`, 
                inline: false 
            });
            // Si la bannière principale existe, afficher celle du serveur en thumbnail
            if (mainBanner) {
                embed.setThumbnail(serverBanner);
            } else {
                embed.setImage(serverBanner);
            }
        } else {
            embed.addFields({ 
                name: 'Bannière du serveur', 
                value: 'Aucune bannière serveur', 
                inline: false 
            });
        }
        
        embed.setFooter({ text: `Demandé par ${fetchedUser.username}` })
            .setTimestamp();
        
        message.reply({ embeds: [embed] });
    }
};
