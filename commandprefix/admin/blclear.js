module.exports = {
    name: 'blclear',
    description: 'Supprime toute la blacklist',
    ownerOnly: true,
    async execute(message, args, client) {
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
