const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'invite',
    description: 'Génère un lien d\'invitation pour le bot',
    developerOnly: true,
    async execute(message, args, client) {
        // Vérifier si l'utilisateur est le développeur
        if (!client.isDeveloper(message.author.id)) {
            return message.reply('Commande réservée au développeur du bot.');
        }
        
        // Remplacer avec ton Client ID
        const clientId = client.user.id;
        
        // Génération du lien d'invitation avec permissions
        const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=8&scope=bot%20applications.commands`;
        
        const embed = new EmbedBuilder()
            .setTitle('Lien d\'invitation du bot')
            .setDescription(`Clique sur le lien ci-dessous pour m'inviter sur un serveur :`)
            .addFields(
                { name: 'Lien d\'invitation', value: `[Inviter le bot](${inviteUrl})` },
                { name: 'Permissions requises', value: 'Administrateur (8) - Toutes les permissions' },
                { name: 'Scopes', value: 'Bot + Applications Commands' }
            )
            .setColor('FFFFFF')
            .setTimestamp()
            .setFooter({ text: `Demandé par ${message.author.tag}`, iconURL: message.author.displayAvatarURL() });
        
        // Envoyer en MP pour plus de sécurité
        try {
            await message.author.send({ embeds: [embed] });
            
            // Confirmer en public
            if (message.channel.type !== 0) { // Si ce n'est pas un MP
                const confirmEmbed = new EmbedBuilder()
                    .setColor('FFFFFF')
                    .setDescription('Le lien d\'invitation t\'a été envoyé en message privé !')
                    .setTimestamp();
                
                await message.reply({ embeds: [confirmEmbed], ephemeral: true });
            }
        } catch (error) {
            // Si les MP sont désactivés
            const errorEmbed = new EmbedBuilder()
                .setColor('FFFFFF')
                .setDescription('Je ne peux pas t\'envoyer le lien en MP. Active tes messages privés ou utilise le lien direct :')
                .addFields({ name: 'Lien direct', value: inviteUrl })
                .setTimestamp();
            
            await message.reply({ embeds: [errorEmbed] });
        }
    }
};
