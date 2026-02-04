const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'delrole',
    description: 'Retire rôle par nom texte',
    permissions: PermissionsBitField.Flags.ManageRoles,
    async execute(message, args, client) {
        // Récupérer la cible soit par mention, soit par réponse
        let target;
        let roleName;
        
        if (message.reference) {
            const referencedMessage = await message.channel.messages.fetch(message.reference.messageId);
            target = referencedMessage.member;
            roleName = args.join(' ').toLowerCase(); // En réponse, tout est le nom du rôle
        } else {
            target = message.mentions.members.first();
            roleName = args.slice(1).join(' ').toLowerCase(); // En mention, le premier arg est la cible
        }
        
        if (!target) return message.reply('Mentionne quelqu\'un ou réponds à son message !');
        if (!roleName) return message.reply('Nom du rôle requis !');
        
        // Recherche rôle insensible à la casse
        const role = message.guild.roles.cache.find(r => 
            r.name.toLowerCase().includes(roleName)
        );
        
        if (!role) return message.reply('Rôle introuvable !');
        
        try {
            await target.roles.remove(role);
            message.reply(`Rôle **${role.name}** retiré de ${target.user.username}`);
            
            // Envoyer les logs
            await client.sendLog(message.guild, 'DelRole', message.member, target, `Rôle: ${role.name}`);
        } catch (error) {
            console.error(error);
            message.reply('Erreur lors du retrait du rôle.');
        }
    }
};
