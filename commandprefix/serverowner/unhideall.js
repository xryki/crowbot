module.exports = {
    name: 'unhideall',
    description: 'Montre tous les salons du serveur',
    ownerOnly: true,
    async execute(message, args, client) {
        // Vérifier si l'utilisateur est un owner
        if (!client.isOwner(message.author.id, message.guild.id)) {
            return message.reply('Commande réservée aux owners du bot.');
        }        
        // Vérifier les permissions Discord (Administrateur requis)
        if (!message.member.permissions.has('Administrator')) {
            return message.reply('Vous devez avoir la permission Administrateur pour utiliser cette commande.');
        }
        
        const guild = message.guild;
        
        try {
            // Récupérer tous les salons du serveur
            const channels = guild.channels.cache.filter(channel => channel.type === 0); //  = GUILD_TEXT
            
            if (channels.size === 0) {
                return message.reply('Aucun salon textuel à montrer.');
            }
            
            let shownCount = 0;
            let errorCount = 0;
            
            // Montrer chaque salon
            for (const [channelId, channel] of channels) {
                try {
                    await channel.permissionOverwrites.edit(guild.roles.everyone, {
                        SendMessages: true,
                        ViewChannel: true
                    });
                    shownCount++;
                } catch (error) {
                    console.error(`Erreur montrant le salon ${channel.name}:`, error);
                    errorCount++;
                }
            }
            
            await message.reply(`${shownCount} salons montrés avec succès${errorCount > 0 ? ` (${errorCount} erreurs)` : ''}.`);
            
        } catch (error) {
            console.error('Erreur dans la commande unhideall:', error);
            return message.reply('Une erreur est survenue lors du montrer des salons.');
        }
    }
};
