const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'unban',
    description: 'Débannit par ID utilisateur',
    permissions: PermissionsBitField.Flags.BanMembers,
    async execute(message, args, client) {
        if (!args[0]) return message.reply('Fournis un ID utilisateur !');
        
        const userId = args[0].replace(/[<@!>]/g, '');
        const reason = args.slice().join(' ') || 'Non spécifié';
        
        // Vérifier les permissions de l'utilisateur
        if (!client.isDeveloper(message.author.id) && !message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
            return;
        }
        
        try {
            await message.guild.bans.remove(userId, reason);
            message.reply(`<@${userId}> débanni. Raison: ${reason}`);
            
            // Envoyer les logs
            await client.sendLog(message.guild, 'Unban', message.member, { id: userId, tag: `@${userId}` }, reason);
        } catch (error) {
            if (error.code === 0) {
                return; // Silencieux si l'utilisateur n'est pas banni
            } else {
                console.error(error);
            }
        }
    }
};
