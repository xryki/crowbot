const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'resetperms',
    description: 'Reset toutes les permissions personnalisées du serveur',
    ownerOnly: true,
    async execute(message, args, client) {
        const guildId = message.guild.id;
        
        // Vérifier si des permissions personnalisées existent
        if (!client.serverPermLevels || !client.serverPermLevels.has(guildId)) {
            return message.reply('Ce serveur n\'a pas de permissions personnalisées à reset.');
        }
        
        try {
            // Demander confirmation
            const confirmMessage = await message.reply(
                `Êtes-vous sûr de vouloir reset TOUTES les permissions personnalisées de ce serveur ?\n` +
                `Cela va revenir aux permissions globales par défaut.\n` +
                `Répondez "oui" pour confirmer ou "non" pour annuler (30 secondes).`
            );
            
            // Créer un collector pour les messages
            const collector = message.channel.createMessageCollector({
                time: 30000, // 30 secondes
                filter: (m) => m.author.id === message.author.id
            });
            
            collector.on('collect', async (m) => {
                if (m.content.toLowerCase() === 'oui') {
                    await confirmMessage.edit('Reset des permissions en cours...');
                    
                    // Supprimer les permissions personnalisées du serveur
                    client.serverPermLevels.delete(guildId);
                    
                    // Sauvegarder les changements
                    if (client.dataSaver) {
                        const serverPermLevelsObj = Object.fromEntries(client.serverPermLevels);
                        client.dataSaver.saveData('serverPermLevels', serverPermLevelsObj);
                    }
                    
                    await confirmMessage.edit('**Permissions reset avec succès !**\nLe serveur utilise maintenant les permissions globales par défaut.');
                    
                } else if (m.content.toLowerCase() === 'non') {
                    await confirmMessage.edit('Opération annulée.');
                }
                
                collector.stop();
            });
            
            collector.on('end', (collected, reason) => {
                if (reason === 'time') {
                    confirmMessage.edit('Opération annulée (délai d\'attente dépassé).');
                }
            });
            
        } catch (error) {
            console.error('Erreur reset perms:', error);
            return message.reply('Une erreur est survenue lors du reset des permissions.');
        }
    }
};
