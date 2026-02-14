const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'addrole',
    description: 'Ajoute rôle par nom texte',
    permissions: PermissionsBitField.Flags.ManageRoles,
    async execute(message, args, client) {
        // Vérifier si l'utilisateur a les permissions nécessaires (Manage Roles ou Administrator)
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageRoles) && 
            !message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply('Tu n\'as pas la permission de gérer les rôles (Manage Roles) ou d\'être administrateur.');
        }
        
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
            await target.roles.add(role);
            message.reply(`Rôle **${role.name}** ajouté à ${target.user.username}`);
            
            // Envoyer les logs
            await client.sendLog(message.guild, 'AddRole', message.member, target, `Rôle: ${role.name}`);
        } catch (error) {
            console.error(error);
            message.reply('Erreur lors de l\'ajout du rôle.');
        }
    }
};
