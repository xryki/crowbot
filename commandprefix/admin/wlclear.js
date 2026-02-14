module.exports = {
    name: 'wlclear',
    description: 'Supprime toute la whitelist',
    ownerOnly: true,
    async execute(message, args, client) {
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
