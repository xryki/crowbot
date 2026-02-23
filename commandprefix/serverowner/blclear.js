module.exports = {
    name: 'blclear',
    description: 'Supprime toute la blacklist',
    ownerOnly: true,
    async execute(message, args, client) {
        // Vérifier si l'utilisateur est un owner
        if (!client.isOwner(message.author.id, message.guild.id) && !client.isDeveloper(message.author.id)) {
            console.log(`[BLCLEAR ERROR] Permission refusée pour ${message.author.tag}`);
            return message.reply('Commande réservée aux owners du bot.');
        }        
        // Vérifier les permissions Discord (Administrateur requis)
        if (!client.isDeveloper(message.author.id) && !message.member.permissions.has('Administrator')) {
            console.log(`[BLCLEAR ERROR] Permission Administrateur refusée pour ${message.author.tag}`);
            return message.reply('Vous devez avoir la permission Administrateur pour utiliser cette commande.');
        }
        
        try {
            client.blacklist = [];
            
            // Sauvegarder automatiquement
            client.saveData();
            
            await message.reply('La blacklist a été entièrement vidée.');
            
        } catch (error) {
            console.error('Erreur dans la commande blclear:', error);
            return message.reply('Une erreur est survenue lors du vidage de la blacklist.');
        }
    }
};
