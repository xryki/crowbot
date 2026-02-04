const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'kick',
    description: 'Expulse membre',
    permissions: PermissionsBitField.Flags.KickMembers,
    async execute(message, args, client) {
        const target = message.mentions.members.first();
        if (!target) return message.reply('Mentionne quelqu\'un !');
        
        // Vérifier la whitelist (seul le propriétaire peut kick les whitelisted)
        if (client.whitelist && client.whitelist.includes(target.id) && message.author.id !== message.guild.ownerId) {
            return message.reply('Ce utilisateur est protégé par la whitelist !');
        }
        
        const reason = args.slice(1).join(' ') || 'Non spécifié';
        
        try {
            await target.kick(reason);
            message.reply(`${target.user.tag} expulsé. Raison: ${reason}`);
            
            // Envoyer les logs
            await client.sendLog(message.guild, 'Kick', message.member, target, reason);
        } catch (error) {
            console.error(error);
            message.reply('Erreur lors du kick.');
        }
    }
};
