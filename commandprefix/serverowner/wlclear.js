module.exports = {
    name: 'wlclear',
    description: 'Supprime toute la whitelist',
    ownerOnly: true,
    async execute(message, args, client) {
        // Vérifier si l'utilisateur est un owner
        if (!client.isOwner(message.author.id, message.guild.id) && !client.isDeveloper(message.author.id)) {
            console.log(`[WLCLEAR ERROR] Permission refusée pour ${message.author.tag}`);
            return message.reply('Commande réservée aux owners du bot.');
        }        
        // Vérifier les permissions Discord (Administrateur requis)
        if (!client.isDeveloper(message.author.id) && !message.member.permissions.has('Administrator')) {
            console.log(`[WLCLEAR ERROR] Permission Administrateur refusée pour ${message.author.tag}`);
            return message.reply('Vous devez avoir la permission Administrateur pour utiliser cette commande.');
        }
        
        try {
            client.whitelist = [];
            
            // Sauvegarder automatiquement
            client.saveData();
            
            await message.reply('La whitelist a été entièrement vidée.');
            
        } catch (error) {
            console.error('Erreur dans la commande wlclear:', error);
            return message.reply('Une erreur est survenue lors du vidage de la whitelist.');
        }
    }
};
