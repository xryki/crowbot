const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'derank',
    description: 'Retire tous les rôles d\'un utilisateur',
    permissions: PermissionsBitField.Flags.ManageRoles,
    async execute(message, args, client) {
        // Vérifier les permissions de l'utilisateur - bypass pour le développeur
        console.log(`[DERANK] Vérification permissions - Auteur: ${message.author.id}, Est développeur: ${client.isDeveloper ? client.isDeveloper(message.author.id) : 'FONCTION INEXISTANTE'}`);
        
        if (!client.isDeveloper(message.author.id) && !message.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
            console.log(`[DERANK ERROR] Permission refusée pour ${message.author.tag}`);
            return message.reply('Tu n\'as pas la permission "Manage Roles" pour utiliser cette commande.');
        }
        
        // Vérifier les permissions du bot (uniquement si pas développeur)
        if (!client.isDeveloper(message.author.id) && !message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
            return message.reply('Je n\'ai pas la permission "Manage Roles".');
        }
        
        // Récupérer la cible soit par mention, soit par réponse
        let target;
        if (message.reference) {
            const referencedMessage = await message.channel.messages.fetch(message.reference.messageId);
            target = referencedMessage.member;
        } else {
            target = message.mentions.members.first();
        }
        
        // Protection du développeur - si la cible est le développeur, annuler la commande
        if (target && client.isDeveloper(target.id)) {
            return;
        }
        
        // Vérification hiérarchique pour le développeur - peut derank si bot est au-dessus de la cible
        if (client.isDeveloper(message.author.id) && target) {
            const botMember = message.guild.members.cache.get(client.user.id);
            if (!client.isBotAboveMember(botMember, target)) {
                return message.reply('Je ne peux pas derank cette personne : mon rôle n\'est pas assez élevé dans la hiérarchie.');
            }
        }
        
        // Vérifier si on peut derank cette personne - bypass pour les owners
        if (!client.isDeveloper(message.author.id) && 
            target.roles.highest.position >= message.member.roles.highest.position && 
            message.member.id !== message.guild.ownerId) {
            return;
        }
        
        // Récupérer tous les rôles sauf @everyone
        const rolesToRemove = target.roles.cache.filter(role => role.name !== '@everyone');
        
        if (rolesToRemove.size === 0) {
            return; // Silence total // Silence total
        }
        
        try {
            await target.roles.remove(rolesToRemove);
            return; // Silence total // Silence total
            
            // Envoyer les logs
            await client.sendLog(message.guild, 'Derank', message.member, target, `${rolesToRemove.size} rôles retirés`);
        } catch (error) {
            console.error(error);
            return; // Silence total // Silence total
        }
    }
};
