const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'derank',
    description: 'Retire tous les rôles d\'un utilisateur',
    permissions: PermissionsBitField.Flags.ManageRoles,
    async execute(message, args, client) {
        // Récupérer la cible soit par mention, soit par réponse
        let target;
        if (message.reference) {
            const referencedMessage = await message.channel.messages.fetch(message.reference.messageId);
            target = referencedMessage.member;
        } else {
            target = message.mentions.members.first();
        }
        
        if (!target) return message.reply('Mentionne un membre ou réponds à son message !');
        
        // Vérifier si on peut derank cette personne
        if (target.roles.highest.position >= message.member.roles.highest.position && message.author.id !== message.guild.ownerId) {
            return message.reply('Tu ne peux pas derank cette personne !');
        }
        
        // Récupérer tous les rôles sauf @everyone
        const rolesToRemove = target.roles.cache.filter(role => role.name !== '@everyone');
        
        if (rolesToRemove.size === 0) {
            return message.reply(`${target.user.username} n\'a aucun rôle à retirer.`);
        }
        
        try {
            await target.roles.remove(rolesToRemove);
            message.reply(`${target.user.username} a été derank (${rolesToRemove.size} rôles retirés).`);
            
            // Envoyer les logs
            await client.sendLog(message.guild, 'Derank', message.member, target, `${rolesToRemove.size} rôles retirés`);
        } catch (error) {
            console.error(error);
            message.reply('Erreur lors du derank.');
        }
    }
};
