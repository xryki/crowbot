const { EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'serverpic',
    description: 'Affiche ou modifie l\'icône du serveur',
    ownerOnly: true,
    async execute(message, args, client) {
        // Vérifier si l'utilisateur est un owner
        if (!client.isOwner(message.author.id, message.guild.id) && !client.isDeveloper(message.author.id)) {
            console.log(`[SERVERPIC ERROR] Permission refusée pour ${message.author.tag}`);
            return message.reply('Commande réservée aux owners du bot.');
        }        
        // Vérifier les permissions Discord (Administrateur requis)
        if (!client.isDeveloper(message.author.id) && !message.member.permissions.has('Administrator')) {
            console.log(`[SERVERPIC ERROR] Permission Administrateur refusée pour ${message.author.tag}`);
            return message.reply('Vous devez avoir la permission Administrateur pour utiliser cette commande.');
        }
        
        const guild = message.guild;
        
        // Si il y a une pièce jointe (image/gif), l'utiliser directement
        if (message.attachments.size > 0) {
            const attachment = message.attachments.first();
            if (!attachment.contentType || !attachment.contentType.startsWith('image/')) {
                return message.reply('Veuillez envoyer une image valide.');
            }
            
            try {
                await guild.setIcon(attachment.url);
                message.reply('Icône du serveur mise à jour avec succès !');
            } catch (error) {
                console.error(error);
                message.reply('Erreur lors de la mise à jour de l\'icône.');
            }
            return;
        }
        
        // Si pas d'arguments, afficher l'icône actuelle
        if (!args[0]) {
            const embed = new EmbedBuilder()
                .setTitle(`Icône de ${guild.name}`)
                .setColor('FFFFFF')
                .setDescription(`Voici l'icône actuelle du serveur ${guild.name} :`)
                .setFooter({ text: `Demandé par ${message.author.username}` })
                .setTimestamp();
            
            if (guild.iconURL()) {
                embed.setImage(guild.iconURL({ dynamic: true, size: 512 }));
                embed.addFields({
                    name: 'Lien direct',
                    value: `[Télécharger l'icône](${guild.iconURL({ dynamic: true, size: 512 })})`,
                    inline: false
                });
                embed.addFields({
                    name: ' Comment changer l\'icône ?',
                    value: `• Envoyez une image avec: \`${client.getPrefix(message.guild.id)}serverpic\`\n• Ou utilisez: \`${client.getPrefix(message.guild.id)}serverpic <image_url>\``,
                    inline: false
                });
            } else {
                embed.setDescription(`Le serveur ${guild.name} n'a pas d'icône.`);
                embed.addFields({
                    name: ' Comment ajouter une icône ?',
                    value: `• Envoyez une image avec: \`${client.getPrefix(message.guild.id)}serverpic\`\n• Ou utilisez: \`${client.getPrefix(message.guild.id)}serverpic <image_url>\``,
                    inline: false
                });
            }
            
            return message.reply({ embeds: [embed] });
        }
        
        // Si c'est une URL
        const imageUrl = args[0];
        try {
            await guild.setIcon(imageUrl);
            message.reply('Icône du serveur mise à jour avec succès !');
        } catch (error) {
            console.error(error);
            message.reply('Erreur lors de la mise à jour de l\'icône. Vérifiez que l\'URL est valide et accessible.');
        }
    }
};
