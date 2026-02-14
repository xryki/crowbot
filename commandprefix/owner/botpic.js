const { EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'botpic',
    description: 'Affiche ou modifie l\'avatar du bot',
    permissions: PermissionsBitField.Flags.Administrator,
    async execute(message, args, client) {
        // Vérifier si l'utilisateur est owner (global ou serveur)
        if (!client.isOwner(message.author.id, message.guild.id)) {
            return message.reply('Commande réservée aux owners du bot.');
        }
        
        const bot = client.user;
        
        // Si il y a une pièce jointe (image/gif), l'utiliser directement
        if (message.attachments.size > 0) {
            const attachment = message.attachments.first();
            if (!attachment.contentType || !attachment.contentType.startsWith('image/')) {
                return message.reply('Veuillez envoyer une image valide.');
            }
            
            try {
                await bot.setAvatar(attachment.url);
                message.reply('Avatar du bot mis à jour avec succès !');
            } catch (error) {
                console.error(error);
                message.reply('Erreur lors de la mise à jour de l\'avatar du bot.');
            }
            return;
        }
        
        // Si pas d'arguments, afficher l'avatar actuel
        if (!args[0]) {
            const embed = new EmbedBuilder()
                .setTitle(`Avatar de ${bot.username}`)
                .setColor('#0099ff')
                .setDescription(`Voici l'avatar actuel du bot **${bot.username}** :`)
                .setFooter({ text: `Demandé par ${message.author.username}` })
                .setTimestamp();
            
            if (bot.avatarURL()) {
                embed.setImage(bot.avatarURL({ dynamic: true, size: 1024 }));
                embed.addFields({
                    name: 'Lien direct',
                    value: `[Télécharger l'avatar](${bot.avatarURL({ dynamic: true, size: 2048 })})`,
                    inline: false
                });
                embed.addFields({
                    name: '💡 Comment changer l\'avatar ?',
                    value: `• Envoyez une image avec: \`${client.getPrefix(message.guild.id)}botpic\`\n• Ou utilisez: \`${client.getPrefix(message.guild.id)}botpic <image_url>\``,
                    inline: false
                });
            } else {
                embed.setDescription(`Le bot **${bot.username}** utilise l'avatar par défaut.`);
                embed.addFields({
                    name: '💡 Comment ajouter un avatar ?',
                    value: `• Envoyez une image avec: \`${client.getPrefix(message.guild.id)}botpic\`\n• Ou utilisez: \`${client.getPrefix(message.guild.id)}botpic <image_url>\``,
                    inline: false
                });
            }
            
            return message.reply({ embeds: [embed] });
        }
        
        // Si c'est une URL
        const imageUrl = args[0];
        try {
            await bot.setAvatar(imageUrl);
            message.reply('Avatar du bot mis à jour avec succès !');
        } catch (error) {
            console.error(error);
            message.reply('Erreur lors de la mise à jour de l\'avatar. Vérifiez que l\'URL est valide et accessible.');
        }
    }
};
