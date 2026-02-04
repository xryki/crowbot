const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'lockname',
    description: 'Verrouille le pseudo d\'un utilisateur',
    permissions: PermissionsBitField.Flags.ManageNicknames,
    async execute(message, args, client) {
        // Vérifier les arguments
        if (!args[0]) {
            return client.autoDeleteMessage(message.channel, `Usage: ${client.getPrefix(message.guild.id)}lockname @utilisateur [nouveau_pseudo]`);
        }
        
        const target = message.mentions.members.first();
        if (!target) {
            return client.autoDeleteMessage(message.channel, 'Veuillez mentionner un utilisateur valide.');
        }
        
        // Vérifier si on peut modifier le pseudo (hiérarchie)
        if (target.roles.highest.position >= message.member.roles.highest.position && message.author.id !== message.guild.ownerId) {
            return client.autoDeleteMessage(message.channel, 'Vous ne pouvez pas modifier le pseudo de cet utilisateur.');
        }
        
        // Obtenir le nouveau pseudo (ou utiliser l'actuel)
        const newNickname = args.slice(1).join(' ') || target.user.username;
        
        try {
            // Sauvegarder l'ancien pseudo s'il n'est pas déjà locké
            if (!client.lockedNames) client.lockedNames = new Map();
            
            if (!client.lockedNames.has(target.id)) {
                client.lockedNames.set(target.id, {
                    originalName: target.nickname || target.user.username,
                    lockedName: newNickname,
                    moderatorId: message.author.id,
                    timestamp: Date.now()
                });
            } else {
                // Mettre à jour le pseudo locké
                client.lockedNames.set(target.id, {
                    ...client.lockedNames.get(target.id),
                    lockedName: newNickname,
                    moderatorId: message.author.id,
                    timestamp: Date.now()
                });
            }
            
            // Appliquer le nouveau pseudo
            await target.setNickname(newNickname);
            
            await client.autoDeleteMessage(message.channel, `Le pseudo de **${target.user.tag}** a été verrouillé sur "${newNickname}"`);
            
        } catch (error) {
            console.error('Erreur lockname:', error);
            await client.autoDeleteMessage(message.channel, 'Une erreur est survenue lors du verrouillage du pseudo.');
        }
    }
};
