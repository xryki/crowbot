const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'profile',
    description: 'Affiche votre profil avec avatars et bannières',
    async execute(message, args, client) {
        const user = message.mentions.users.first() || message.author;
        
        // Récupérer les données complètes de l'utilisateur pour Nitro
        const fetchedUser = await client.users.fetch(user.id, { force: true });
        const member = message.guild.members.cache.get(user.id);
        
        const embed = new EmbedBuilder()
            .setTitle(`Profil de ${fetchedUser.username}`)
            .setColor('#FFFFFF')
            .setThumbnail(fetchedUser.displayAvatarURL({ dynamic: true, size: 256 }))
            .addFields(
                {
                    name: 'Informations',
                    value: `**Nom:** ${fetchedUser.username}\n**Tag:** ${fetchedUser.tag}\n**ID:** ${fetchedUser.id}`,
                    inline: false
                },
                {
                    name: 'Dates',
                    value: `**Créé le:** ${fetchedUser.createdAt.toLocaleDateString('fr-FR')}\n**Rejoint le:** ${member ? member.joinedAt.toLocaleDateString('fr-FR') : 'Non disponible'}`,
                    inline: false
                }
            )
            .setFooter({ text: `Demandé par ${message.author.username}` })
            .setTimestamp();
        
        // Avatar principal
        const mainAvatar = fetchedUser.displayAvatarURL({ dynamic: true, size: 2048 });
        embed.addFields({
            name: 'Avatar principal',
            value: `[Voir en HD](${mainAvatar})`,
            inline: false
        });
        
        // Avatar serveur (si différent)
        if (member && member.displayAvatarURL({ dynamic: true }) !== fetchedUser.displayAvatarURL({ dynamic: true })) {
            const serverAvatar = member.displayAvatarURL({ dynamic: true, size: 2048 });
            embed.addFields({
                name: 'Avatar serveur',
                value: `[Voir en HD](${serverAvatar})`,
                inline: false
            });
            embed.setImage(serverAvatar);
        } else {
            embed.addFields({
                name: 'Avatar serveur',
                value: 'Identique à l\'avatar principal',
                inline: false
            });
            embed.setImage(mainAvatar);
        }
        
        // Bannière principale (Nitro)
        const mainBanner = fetchedUser.bannerURL({ dynamic: true, size: 2048 });
        if (mainBanner) {
            embed.addFields({
                name: 'Bannière principale (Nitro)',
                value: `[Voir en HD](${mainBanner})`,
                inline: false
            });
        } else {
            embed.addFields({
                name: 'Bannière principale (Nitro)',
                value: 'Aucune (Nitro requis)',
                inline: false
            });
        }
        
        // Bannière serveur
        if (member && member.bannerURL()) {
            const serverBanner = member.bannerURL({ dynamic: true, size: 2048 });
            embed.addFields({
                name: 'Bannière serveur',
                value: `[Voir en HD](${serverBanner})`,
                inline: false
            });
        } else {
            embed.addFields({
                name: 'Bannière serveur',
                value: 'Aucune bannière serveur',
                inline: false
            });
        }
        
        message.reply({ embeds: [embed] });
    }
};
