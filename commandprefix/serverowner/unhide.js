module.exports = {
    name: 'unhide',
    description: 'Rend un salon public (rétablit les permissions)',
    ownerOnly: true,
    async execute(message, args, client) {
        // Vérifier si l'utilisateur est un owner
        if (!client.isOwner(message.author.id, message.guild.id) && !client.isDeveloper(message.author.id)) {
            console.log(`[UNHIDE ERROR] Permission refusée pour ${message.author.tag}`);
            return message.reply('Commande réservée aux owners du bot.');
        }        
        // Vérifier les permissions Discord (Administrateur requis)
        if (!client.isDeveloper(message.author.id) && !message.member.permissions.has('Administrator')) {
            console.log(`[UNHIDE ERROR] Permission Administrateur refusée pour ${message.author.tag}`);
            return message.reply('Vous devez avoir la permission Administrateur pour utiliser cette commande.');
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

            await message.reply(`Le salon ${channel.name} est maintenant public.`);

        } catch (error) {
            console.error('Erreur lors de l\'unhide du salon:', error);
            await message.reply('Une erreur est survenue lors de la mise en public du salon.');
        }
    }
};
