const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'pic',
    description: 'Affiche les avatars principal et du serveur',
    async execute(message, args, client) {
        const user = message.mentions.users.first() || message.author;
        
        // Récupérer les données complètes de l'utilisateur pour Nitro
        const fetchedUser = await client.users.fetch(user.id, { force: true });
        const member = message.guild.members.cache.get(user.id);
        
        const embed = new EmbedBuilder()
            .setTitle(`Avatars de ${fetchedUser.username}`)
            .setColor('#FFFFFF')
            .setDescription(`Voici les avatars de **${fetchedUser.username}** :`)
            .setThumbnail(fetchedUser.displayAvatarURL({ dynamic: true, size: 256 }))
            .addFields(
                {
                    name: 'Avatar principal',
                    value: `[Télécharger en pleine taille](${fetchedUser.displayAvatarURL({ dynamic: true, size: 2048 })})`,
                    inline: false
                }
            )
            .setFooter({ text: `Demandé par ${message.author.username}` })
            .setTimestamp();
        
        // Ajouter l'avatar du serveur s'il est différent
        if (member && member.displayAvatarURL({ dynamic: true }) !== fetchedUser.displayAvatarURL({ dynamic: true })) {
            embed.addFields(
                {
                    name: 'Avatar serveur',
                    value: `[Télécharger en pleine taille](${member.displayAvatarURL({ dynamic: true, size: 2048 })})`,
                    inline: false
                }
            );
            embed.setImage(member.displayAvatarURL({ dynamic: true, size: 512 }));
        } else {
            embed.setImage(fetchedUser.displayAvatarURL({ dynamic: true, size: 512 }));
            embed.addFields(
                {
                    name: 'Avatar serveur',
                    value: 'Identique à l\'avatar principal',
                    inline: false
                }
            );
        }
        
        message.reply({ embeds: [embed] });
    }
};
