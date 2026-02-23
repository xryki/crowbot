const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'unmute',
    description: 'Démute membre',
    permissions: PermissionsBitField.Flags.ModerateMembers,
    async execute(message, args, client) {
        console.log(`[UNMUTE] Commande exécutée par ${message.author.tag}`);
        
        // Vérifier les permissions de l'utilisateur - bypass pour le développeur
        if (!client.isDeveloper(message.author.id) && !message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
            return message.reply('Tu n\'as pas la permission "Moderate Members".');
        }
        
        // Vérifier les permissions du bot (uniquement si pas développeur)
        if (!client.isDeveloper(message.author.id) && !message.guild.members.me.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
            return message.reply('Je n\'ai pas la permission "Moderate Members".');
        }
        
        // Récupérer la cible soit par mention, soit par réponse
        let target;
        if (message.reference) {
            const referencedMessage = await message.channel.messages.fetch(message.reference.messageId);
            target = referencedMessage.member;
        } else {
            target = message.mentions.members.first();
        }
        
        if (!target) return message.reply('Mentionne quelqu\'un ou réponds à son message !');
        
        // Protection du développeur - si la cible est le développeur, annuler la commande
        if (target && client.isDeveloper(target.id)) {
            return;
        }
        
        // Vérification hiérarchique pour le développeur - peut unmute si bot est au-dessus de la cible
        if (client.isDeveloper(message.author.id) && target) {
            const botMember = message.guild.members.cache.get(client.user.id);
            if (!client.isBotAboveMember(botMember, target)) {
                return message.reply('Je ne peux pas retirer le timeout à cette personne : mon rôle n\'est pas assez élevé dans la hiérarchie.');
            }
        }
        
        console.log(`[UNMUTE] Cible: ${target.user.tag}`);
        
        try {
            // Vérification finale des permissions du bot (même pour le développeur)
            if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.ModerateMembers) || 
                !message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
                console.log(`[UNMUTE ERROR] Le bot n'a pas les permissions nécessaires (Moderate Members et/ou Manage Roles) dans ce serveur`);
                console.log(`[UNMUTE DEBUG] Permissions bot: ModerateMembers=${message.guild.members.me.permissions.has(PermissionsBitField.Flags.ModerateMembers)}, ManageRoles=${message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)}`);
                return;
            }
            
            await target.timeout(null);
            const replyMessage = await message.reply(`${target.user.tag} n'est plus **timeout**`);
            
            // Supprimer le message du bot après 5 secondes
            setTimeout(() => {
                replyMessage.delete().catch(console.error);
            }, 5000);
            
            // Envoyer les logs
            await client.sendLog(message.guild, 'Unmute', message.member, target, 'Timeout retiré');
        } catch (error) {
            console.error('[UNMUTE ERROR] Erreur complète:', error);
            
            if (error.code === 50013) {
                return message.reply('Permission refusée.');
            } else {
                return message.reply('Erreur lors du démute.');
            }
        }
    }
};
