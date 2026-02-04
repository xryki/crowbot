const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'invite',
    description: 'Génère un lien d\'invitation pour le bot',
    async execute(message, args, client) {
        // Vérifier si c'est un owner
        if (!client.isOwner(message.author.id, message.guild.id)) {
            return message.reply('Seul les owners du bot peuvent utiliser cette commande.');
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
            .setColor('#0099ff')
            .setTimestamp()
            .setFooter({ text: `Demandé par ${message.author.tag}`, iconURL: message.author.displayAvatarURL() });
        
        // Envoyer en MP pour plus de sécurité
        try {
            await message.author.send({ embeds: [embed] });
            
            // Confirmer en public
            if (message.channel.type !== 1) { // Si ce n'est pas un MP
                const confirmEmbed = new EmbedBuilder()
                    .setColor('#00ff00')
                    .setDescription('Le lien d\'invitation t\'a été envoyé en message privé !')
                    .setTimestamp();
                
                await message.reply({ embeds: [confirmEmbed], ephemeral: true });
            }
        } catch (error) {
            // Si les MP sont désactivés
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setDescription('Je ne peux pas t\'envoyer le lien en MP. Active tes messages privés ou utilise le lien direct :')
                .addFields({ name: 'Lien direct', value: inviteUrl })
                .setTimestamp();
            
            await message.reply({ embeds: [errorEmbed] });
        }
    }
};
