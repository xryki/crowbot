const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'addrole',
    description: 'Ajoute rôle par nom texte',
    permissions: PermissionsBitField.Flags.ManageRoles,
    async execute(message, args, client) {
        console.log(`[ADDROLE] Commande exécutée par ${message.author.tag} avec args:`, args);
        
        // Vérifier si l'utilisateur a les permissions nécessaires (Manage Roles ou Administrator) - bypass pour le développeur
        if (!client.isDeveloper(message.author.id) && 
            !message.member.permissions.has(PermissionsBitField.Flags.ManageRoles) && 
            !message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply('Tu n\'as pas la permission de gérer les rôles (Manage Roles) ou d\'être administrateur.');
        }
        
        // Vérifier les permissions du bot
        if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
            return message.reply('Je n\'ai pas la permission de gérer les rôles.');
        }
        
        // Récupérer la cible soit par mention, soit par réponse
        let target;
        let roleName;
        
        if (message.reference) {
            const referencedMessage = await message.channel.messages.fetch(message.reference.messageId);
            target = referencedMessage.member;
            roleName = args.join(' '); // En réponse, tout est le nom du rôle
        } else {
            target = message.mentions.members.first();
            roleName = args.slice(1).join(' '); // En mention, tout après la mention est le nom du rôle
        }
        
        console.log(`[ADDROLE] Target: ${target?.user?.tag}, RoleName: "${roleName}"`);
        
        if (!target) return message.reply('Mentionne quelqu\'un ou réponds à son message !');
        if (!roleName) return message.reply('Nom du rôle requis !');
        
        // Recherche rôle insensible à la casse
        const role = message.guild.roles.cache.find(r => 
            r.name.toLowerCase() === roleName.toLowerCase()
        );
        
        console.log(`[ADDROLE] Rôle recherché: "${roleName}", Trouvé: ${role ? role.name : 'NON'}`);
        
        if (!role) {
            // Afficher les rôles disponibles pour aider
            const availableRoles = message.guild.roles.cache.map(r => r.name).join(', ');
            console.log(`[ADDROLE] Rôles disponibles: ${availableRoles}`);
            return message.reply(`Rôle "${roleName}" introuvable !\nRôles disponibles: ${availableRoles.substring(0, 200)}...`);
        }
        
        try {
            // Vérifier si le bot peut gérer ce rôle
            if (role.position >= message.guild.members.me.roles.highest.position) {
                return message.reply('Je ne peux pas gérer ce rôle (il est au-dessus de mon rôle le plus élevé).');
            }
            
            // Vérifier si l'utilisateur peut gérer ce rôle - bypass pour les owners
            if (!client.isDeveloper(message.author.id) && 
                role.position >= message.member.roles.highest.position && 
                message.member.id !== message.guild.ownerId) {
                return message.reply('Tu ne peux pas gérer ce rôle (il est au-dessus de ton rôle le plus élevé).');
            }
            
            await target.roles.add(role);
            message.reply(`Rôle ${role.name} ajouté à ${target.user.username}`);
            
            // Envoyer les logs
            await client.sendLog(message.guild, 'AddRole', message.member, target, `Rôle: ${role.name}`);
        } catch (error) {
            console.error('[ADDROLE ERROR] Erreur complète:', error);
            
            // Messages d'erreur détaillés
            if (error.code === 50013) {
                message.reply('Permission refusée - vérifie les hiérarchies des rôles.');
            } else {
                message.reply(`Erreur lors de l\'ajout du rôle: ${error.message}`);
            }
        }
    }
};
