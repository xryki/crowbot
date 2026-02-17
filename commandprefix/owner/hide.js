module.exports = {
    name: 'hide',
    description: 'Met un salon en privé (cache les permissions)',
    ownerOnly: true,
    async execute(message, args, client) {
        // Vérifier si l'utilisateur est un owner
        if (!client.isOwner(message.author.id, message.guild.id)) {
            return message.reply('Commande réservée aux owners du bot.');
        }
        
        const guild = message.guild;
        const channel = message.mentions.channels.first() || message.channel;
        
        if (!channel) {
            return message.reply('Veuillez mentionner un salon ou utiliser cette commande dans un salon.');
        }

        try {
            // Supprimer toutes les permissions existantes
            const existingOverwrites = channel.permissionOverwrites.cache;
            for (const [id, overwrite] of existingOverwrites) {
                await channel.permissionOverwrites.delete(id);
            }

            // Ajouter les permissions pour le propriétaire uniquement
            await channel.permissionOverwrites.create(guild.id, {
                ViewChannel: true,
                SendMessages: true,
                ReadMessageHistory: true,
                EmbedLinks: true,
                AttachFiles: true,
                AddReactions: true
            });

            // Bloquer l'accès à @everyone
            await channel.permissionOverwrites.create(guild.roles.everyone, {
                ViewChannel: false,
                SendMessages: false,
                ReadMessageHistory: false,
                EmbedLinks: false,
                AttachFiles: false,
                AddReactions: false
            });

            await message.reply(`Le salon ${channel.name} est maintenant privé.`);

        } catch (error) {
            console.error('Erreur lors du hide du salon:', error);
            await message.reply('Une erreur est survenue lors de la mise en privé du salon.');
        }
    }
};
