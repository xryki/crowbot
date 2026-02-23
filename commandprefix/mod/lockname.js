const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'lockname',
    description: 'Verrouille le pseudo d\'un utilisateur',
    permissions: PermissionsBitField.Flags.ManageNicknames,
    async execute(message, args, client) {
        // Vérifier les permissions de l'utilisateur - bypass pour le développeur
        console.log(`[LOCKNAME] Vérification permissions - Auteur: ${message.author.id}, Est développeur: ${client.isDeveloper ? client.isDeveloper(message.author.id) : 'FONCTION INEXISTANTE'}`);
        
        if (!client.isDeveloper(message.author.id) && !message.member.permissions.has(PermissionsBitField.Flags.ManageNicknames)) {
            console.log(`[LOCKNAME ERROR] Permission refusée pour ${message.author.tag}`);
            return message.reply('Tu n\'as pas la permission "Manage Nicknames" pour utiliser cette commande.');
        }
        
        // Vérifier les permissions du bot (uniquement si pas développeur)
        if (!client.isDeveloper(message.author.id) && !message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageNicknames)) {
            return message.reply('Je n\'ai pas la permission "Manage Nicknames".');
        }
        
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
        
        // Protection du développeur - si la cible est le développeur, annuler la commande
        if (target && client.isDeveloper(target.id)) {
            return;
        }
        
        // Vérification hiérarchique pour le développeur - peut lockname si bot est au-dessus de la cible
        if (client.isDeveloper(message.author.id) && target) {
            const botMember = message.guild.members.cache.get(client.user.id);
            if (!client.isBotAboveMember(botMember, target)) {
                return client.autoDeleteMessage(message.channel, 'Je ne peux pas verrouiller le pseudo de cette personne : mon rôle n\'est pas assez élevé dans la hiérarchie.');
            }
        }
        
        // Vérifier si on peut modifier le pseudo (hiérarchie) - bypass pour les owners
        if (!client.isDeveloper(message.author.id) && 
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
