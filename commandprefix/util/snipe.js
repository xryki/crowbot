const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'snipe',
    description: 'Affiche les messages supprimés (historique jusqu\'à 10 messages)',
    async execute(message, args, client) {
        // Initialiser la collection de messages snipés si elle n'existe pas
        client.snipes = client.snipes || new Map();
        
        const guildSnipes = client.snipes.get(message.guild.id) || [];
        
        if (guildSnipes.length === 0) {
            return message.reply('Aucun message supprimé récemment.');
        }
        
        const index = parseInt(args[0]) || 1;
        
        if (index < 1 || index > guildSnipes.length) {
            return message.reply(`Index invalide ! Messages disponibles: 1-${guildSnipes.length}`);
        }
        
        const snipedMessage = guildSnipes[index - 1];
        
        const embed = new EmbedBuilder()
            .setTitle('Message supprimé')
            .setColor('#ff0000')
            .setAuthor({
                name: snipedMessage.author.tag,
                iconURL: snipedMessage.author.displayAvatarURL({ dynamic: true })
            })
            .setDescription(snipedMessage.content || '*(Message vide ou embed)*')
            .addFields(
                { name: 'Auteur', value: `${snipedMessage.author.tag} (${snipedMessage.author.id})`, inline: true },
                { name: 'Salon', value: `<#${snipedMessage.channelId}>`, inline: true },
                { name: 'Supprimé il y a', value: `${Math.floor((Date.now() - snipedMessage.deletedAt) / 1000)} secondes`, inline: true }
            )
            .setFooter({ 
                text: `Message ${index}/${guildSnipes.length} | Demandé par ${message.author.username}` 
            })
            .setTimestamp();
        
        // Ajouter l'image si le message en contenait une
        if (snipedMessage.attachments && snipedMessage.attachments.size > 0) {
            const attachment = snipedMessage.attachments.first();
            if (attachment.contentType && attachment.contentType.startsWith('image/')) {
                embed.setImage(attachment.url);
                embed.addFields(
                    { name: 'Image', value: `[Voir l'image](${attachment.url})`, inline: false }
                );
            }
        }
        
        message.reply({ embeds: [embed] });
    }
};
