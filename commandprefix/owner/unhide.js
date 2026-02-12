module.exports = {
    name: 'unhide',
    description: 'Rend un salon public (rétablit les permissions)',
    ownerOnly: true,
    async execute(message, args, client) {
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

            await message.reply(`Le salon **${channel.name}** est maintenant public.`);

        } catch (error) {
            console.error('Erreur lors de l\'unhide du salon:', error);
            await message.reply('Une erreur est survenue lors de la mise en public du salon.');
        }
    }
};
