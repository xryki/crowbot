const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'resetserverperms',
    description: 'Reset toutes les permissions de rôles du serveur (faites avec !setperm)',
    ownerOnly: true,
    async execute(message, args, client) {
        const guildId = message.guild.id;
        
        // Vérifier si des permissions de rôles existent
        if (!client.permissions || !client.permissions.has(guildId)) {
            return message.reply('Ce serveur n\'a pas de permissions de rôles à reset.');
        }
        
        try {
            // Demander confirmation
            const confirmMessage = await message.reply(
                `Êtes-vous sûr de vouloir reset TOUTES les permissions de rôles de ce serveur ?\n` +
                `Cela va supprimer toutes les permissions faites avec !setperm.\n` +
                `Répondez "oui" pour confirmer ou "non" pour annuler (30 secondes).`
            );
            
            // Créer un collector pour les messages
            const collector = message.channel.createMessageCollector({
                time: 30000, // 30 secondes
                filter: (m) => m.author.id === message.author.id
            });
            
            collector.on('collect', async (m) => {
                if (m.content.toLowerCase() === 'oui') {
                    await confirmMessage.edit('Reset des permissions de rôles en cours...');
                    
                    // Supprimer les permissions de rôles du serveur
                    client.permissions.delete(guildId);
                    
                    // Sauvegarder les changements
                    if (client.permissionSystem) {
                        client.permissionSystem.savePermissions();
                    }
                    
                    await confirmMessage.edit('**Permissions de rôles reset avec succès !**\nToutes les permissions faites avec !setperm ont été supprimées.');
                    
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
            console.error('Erreur reset server perms:', error);
            return message.reply('Une erreur est survenue lors du reset des permissions de rôles.');
        }
    }
};
