const { EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'botbanner',
    description: 'Affiche ou modifie la bannière du bot',
    permissions: PermissionsBitField.Flags.Administrator,
    async execute(message, args, client) {
        const bot = client.user;
        
        // Si il y a une pièce jointe (image/gif), l'utiliser directement
        if (message.attachments.size > 0) {
            const attachment = message.attachments.first();
            if (!attachment.contentType || !attachment.contentType.startsWith('image/')) {
                return message.reply('Veuillez envoyer une image valide.');
            }
            
            try {
                await bot.setBanner(attachment.url);
                message.reply('Bannière du bot mise à jour avec succès !');
            } catch (error) {
                console.error(error);
                message.reply('Erreur lors de la mise à jour de la bannière du bot.');
            }
            return;
        }
        
        // Si pas d'arguments, afficher la bannière actuelle
        if (!args[0]) {
            const embed = new EmbedBuilder()
                .setTitle(`Bannière de ${bot.username}`)
                .setColor('#0099ff')
                .setDescription(`Voici la bannière actuelle du bot **${bot.username}** :`)
                .setFooter({ text: `Demandé par ${message.author.username}` })
                .setTimestamp();
            
            if (bot.bannerURL()) {
                embed.setImage(bot.bannerURL({ dynamic: true, size: 1024 }));
                embed.addFields({
                    name: 'Lien direct',
                    value: `[Télécharger la bannière](${bot.bannerURL({ dynamic: true, size: 2048 })})`,
                    inline: false
                });
                embed.addFields({
                    name: '💡 Comment changer la bannière ?',
                    value: `• Envoyez une image avec: \`${client.getPrefix(message.guild.id)}botbanner\`\n• Ou utilisez: \`${client.getPrefix(message.guild.id)}botbanner <image_url>\``,
                    inline: false
                });
            } else {
                embed.setDescription(`Le bot **${bot.username}** n'a pas de bannière.`);
                embed.addFields({
                    name: '💡 Comment ajouter une bannière ?',
                    value: `• Envoyez une image avec: \`${client.getPrefix(message.guild.id)}botbanner\`\n• Ou utilisez: \`${client.getPrefix(message.guild.id)}botbanner <image_url>\``,
                    inline: false
                });
            }
            
            return message.reply({ embeds: [embed] });
        }
        
        // Si c'est une URL
        const imageUrl = args[0];
        try {
            await bot.setBanner(imageUrl);
            message.reply('Bannière du bot mise à jour avec succès !');
        } catch (error) {
            console.error(error);
            message.reply('Erreur lors de la mise à jour de la bannière. Vérifiez que l\'URL est valide et accessible.');
        }
    }
};
