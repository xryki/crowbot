const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'user',
    description: 'Infos utilisateur (mention possible)',
    async execute(message, args) {
        const member = message.mentions.members.first() || message.member;
        const user = member.user;
        
        const embed = new EmbedBuilder()
            .setTitle(`${user.username}`)
            .setThumbnail(user.displayAvatarURL())
            .addFields(
                { name: 'ID', value: user.id, inline: true },
                { name: 'Compte créé', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true },
                { name: 'Rejoint le serveur', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true },
                { name: 'Rôles', value: member.roles.cache.map(r => r.name).join(', ') || 'Aucun', inline: false }
            )
            .setColor('FFFFFF');
        
        message.reply({ embeds: [embed] });
    }
};
