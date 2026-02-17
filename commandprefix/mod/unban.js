const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'unban',
    description: 'Débannit par ID utilisateur',
    permissions: PermissionsBitField.Flags.BanMembers,
    async execute(message, args) {
        if (!args[0]) return message.reply('Fournis un ID utilisateur !');
        
        const userId = args[0].replace(/[<@!>]/g, '');
        const reason = args.slice().join(' ') || 'Non spécifié';
        
        try {
            await message.guild.bans.remove(userId, reason);
            message.reply(`<@${userId}> débanni. Raison: ${reason}`);
        } catch (error) {
            if (error.code === 0) {
                message.reply('Cet utilisateur n\'est pas banni.');
            } else {
                message.reply('Erreur: ID invalide ou pas de permissions.');
            }
        }
    }
};
