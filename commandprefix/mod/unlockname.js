const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'unlockname',
    description: 'Déverrouille le pseudo d\'un utilisateur',
    permissions: PermissionsBitField.Flags.ManageNicknames,
    async execute(message, args, client) {
        // Vérifier les arguments
        if (!args[0]) {
            return client.autoDeleteMessage(message.channel, `Usage: ${client.getPrefix(message.guild.id)}unlockname @utilisateur`);
        }
        
        const target = message.mentions.members.first();
        if (!target) {
            return client.autoDeleteMessage(message.channel, 'Veuillez mentionner un utilisateur valide.');
        }
        
        // Vérifier si le pseudo est locké
        if (!client.lockedNames || !client.lockedNames.has(target.id)) {
            return client.autoDeleteMessage(message.channel, `Le pseudo de **${target.user.tag}** n'est pas verrouillé.`);
        }
        
        try {
            // Récupérer l'ancien pseudo
            const lockData = client.lockedNames.get(target.id);
            const originalName = lockData.originalName;
            
            // Retirer le lock
            client.lockedNames.delete(target.id);
            
            // Sauvegarder automatiquement
            client.saveData();
            
            // Remettre l'ancien pseudo
            await target.setNickname(originalName);
            
            await client.autoDeleteMessage(message.channel, `Le pseudo de **${target.user.tag}** a été déverrouillé et remis sur "${originalName}"`);
            
        } catch (error) {
            console.error('Erreur unlockname:', error);
            await client.autoDeleteMessage(message.channel, 'Une erreur est survenue lors du déverrouillage du pseudo.');
        }
    }
};
