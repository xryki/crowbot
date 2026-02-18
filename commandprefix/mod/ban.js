const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'ban',
    description: 'Bannit membre',
    permissions: PermissionsBitField.Flags.BanMembers,
    async execute(message, args, client) {
        let target;
        let targetId;
        
        // Vérifier si c'est une mention ou un ID
        if (message.mentions.members.first()) {
            target = message.mentions.members.first();
            targetId = target.id;
        } else if (args[0] && /^\d+$/.test(args[0])) {
            // C'est un ID numérique
            targetId = args[0];
            try {
                target = await message.guild.members.fetch(targetId);
            } catch (error) {
                try {
                    // Essayer de bannir par ID même si le membre n'est pas sur le serveur
                    target = { id: targetId, user: { tag: `Utilisateur ${targetId}` } };
                } catch (fetchError) {
                    return message.reply('ID invalide ou utilisateur non trouvé !');
                }
            }
        } else {
            return message.reply('Mentionne quelqu\'un ou donne un ID valide !');
        }
        
        if (targetId === message.author.id) return message.reply('Tu ne peux pas te ban !');
        
        // Vérifier la whitelist (seul le propriétaire peut bannir les whitelisted) - bypass pour les owners
        if (client.whitelist && client.whitelist.includes(targetId) && !client.isDeveloper(message.author.id) && message.author.id !== message.guild.ownerId) {
            return message.reply('Ce utilisateur est protégé par la whitelist !');
        }
        
        const reason = args.slice().join(' ') || 'Non spécifié';
        
        try {
            await message.guild.members.ban(targetId, { reason });
            const targetName = target.user ? target.user.tag : `Utilisateur ${targetId}`;
            message.reply(`${targetName} banni. Raison: ${reason}`);
            
            // Envoyer les logs
            await client.sendLog(message.guild, 'Ban', message.member, target, reason);
        } catch (error) {
            console.error(error);
            message.reply('Erreur lors du ban.');
        }
    }
};
