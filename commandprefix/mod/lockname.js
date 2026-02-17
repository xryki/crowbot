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
        
        // Debug
        console.log(`[DEBUG] Target ID: ${target.id}`);
        console.log(`[DEBUG] Target tag: ${target.user.tag}`);
        console.log(`[DEBUG] Target username: ${target.user.username}`);
        
        // Vérifier si on peut modifier le pseudo (hiérarchie) - bypass pour les owners
        if (!client.isOwner(message.author.id, message.guild.id) && 
            target.roles.highest.position >= message.member.roles.highest.position && 
            message.author.id !== message.guild.ownerId) {
            return client.autoDeleteMessage(message.channel, 'Vous ne pouvez pas modifier le pseudo de cet utilisateur.');
        }
        
        // Obtenir le nouveau pseudo (enlever la mention de l'utilisateur)
        const newNickname = args.slice(1).join(' ') || target.user.username;
        
        try {
            // Sauvegarder l'ancien pseudo s'il n'est pas déjà locké
            if (!client.lockedNames) client.lockedNames = new Map();
            
            if (!client.lockedNames.has(target.id)) {
                client.lockedNames.set(target.id, {
                    originalName: target.nickname || target.user.username, // Pseudo actuel ou username de base
                    lockedName: newNickname,
                    moderatorId: message.author.id,
                    timestamp: Date.now()
                });
            } else {
                // Mettre à jour le pseudo locké mais garder l'originalName original
                const existingData = client.lockedNames.get(target.id);
                client.lockedNames.set(target.id, {
                    originalName: existingData.originalName, // Garder le vrai pseudo d'origine
                    lockedName: newNickname,
                    moderatorId: message.author.id,
                    timestamp: Date.now()
                });
            }
            
            // Appliquer le nouveau pseudo
            await target.setNickname(newNickname);
            
            // Sauvegarder automatiquement
            client.saveData();
            
            await client.autoDeleteMessage(message.channel, `Le pseudo de <@${target.id}> a été verrouillé sur "${newNickname}"`);
            
        } catch (error) {
            console.error('Erreur lockname:', error);
            await client.autoDeleteMessage(message.channel, 'Une erreur est survenue lors du verrouillage du pseudo.');
        }
    }
};
