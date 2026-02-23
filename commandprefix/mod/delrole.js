const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'delrole',
    description: 'Retire rôle par nom texte',
    permissions: PermissionsBitField.Flags.ManageRoles,
    async execute(message, args, client) {
        console.log(`[DELROLE] Commande exécutée par ${message.author.tag} avec args:`, args);
        
        // Actualiser le cache des rôles pour détecter les nouveaux rôles
        await message.guild.roles.fetch();
        
        // Vérifier si l'utilisateur a les permissions nécessaires - bypass pour les owners
        console.log(`[DELROLE] Vérification permissions - Auteur: ${message.author.id}, Est développeur: ${client.isDeveloper ? client.isDeveloper(message.author.id) : 'FONCTION INEXISTANTE'}`);
        
        if (!client.isDeveloper(message.author.id) && 
            !message.member.permissions.has(PermissionsBitField.Flags.ManageRoles) && 
            !message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            console.log(`[DELROLE ERROR] Permission refusée pour ${message.author.tag}`);
            return;
        }
        
        // Vérifier les permissions du bot (uniquement si pas développeur)
        if (!client.isDeveloper(message.author.id) && !message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
            return;
        }
        
        // Récupérer la cible soit par mention, soit par réponse
        let target;
        let roleName;
        
        if (message.reference) {
            const referencedMessage = await message.channel.messages.fetch(message.reference.messageId);
            target = referencedMessage.member;
            // En réponse, vérifier si c'est une mention de rôle ou un nom de rôle
            const roleMention = message.mentions.roles.first();
            if (roleMention) {
                roleName = roleMention.name;
            } else {
                roleName = args.join(' ');
            }
        } else {
            target = message.mentions.members.first();
            // En mention, vérifier si c'est une mention de rôle ou un nom de rôle
            const roleMention = message.mentions.roles.first();
            if (roleMention) {
                roleName = roleMention.name;
            } else {
                roleName = args.slice(1).join(' ');
            }
        }
        
        // Protection du développeur - si la cible est le développeur, annuler la commande
        if (target && client.isDeveloper(target.id)) {
            return;
        }
        
        // Vérification hiérarchique pour le développeur - peut delrole si bot est au-dessus de la cible
        if (client.isDeveloper(message.author.id) && target) {
            const botMember = message.guild.members.cache.get(client.user.id);
            if (!client.isBotAboveMember(botMember, target)) {
                return message.reply('Je ne peux pas retirer un rôle à cette personne : mon rôle n\'est pas assez élevé dans la hiérarchie.');
            }
        }
        
        // Vérifier les permissions du bot
        if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
            return;
        }
        
        console.log(`[DELROLE] Target: ${target?.user?.tag}, RoleName: "${roleName}"`);
        
        if (!target) return message.reply('Mentionne quelqu\'un ou réponds à son message !');
        if (!roleName) return message.reply('Nom du rôle requis !');
        
        // Recherche rôle - d'abord par mention, puis par nom
        let role;
        
        // Vérifier si c'est une mention de rôle
        const roleMention = message.mentions.roles.first();
        if (roleMention) {
            role = roleMention;
            console.log(`[DELROLE] Rôle trouvé par mention: ${role.name}`);
        } else {
            // Recherche par nom insensible à la casse
            console.log(`[DELROLE] Tous les rôles disponibles:`, message.guild.roles.cache.map(r => r.name).join(', '));
            
            role = message.guild.roles.cache.find(r => 
                r.name.toLowerCase() === roleName.toLowerCase()
            );
            
            console.log(`[DELROLE] Rôle recherché par nom: "${roleName}", Trouvé: ${role ? role.name : 'NON'}`);
        }
        
        console.log(`[DELROLE] Rôle final: ${role ? role.name : 'NON'}, Nombre total de rôles: ${message.guild.roles.cache.size}`);
        
        if (!role) {
            // Afficher les rôles disponibles pour aider
            const availableRoles = message.guild.roles.cache.map(r => r.name).join(', ');
            console.log(`[DELROLE] Rôles disponibles: ${availableRoles}`);
            return;
        }
        
        try {
            // Vérifier si le bot peut gérer ce rôle
            if (role.position >= message.guild.members.me.roles.highest.position) {
                return;
            }
            
            // Vérifier si l'utilisateur peut gérer ce rôle - bypass pour les owners
            if (!client.isDeveloper(message.author.id) && 
                role.position >= message.member.roles.highest.position && 
                message.member.id !== message.guild.ownerId) {
                return;
            }
            
            // Vérifier si l'utilisateur a le rôle
            if (!target.roles.cache.has(role.id)) {
                return;
            }
            
            await target.roles.remove(role);
            
            // Envoyer les logs
            await client.sendLog(message.guild, 'DelRole', message.member, target, `Rôle: ${role.name}`);
            
            // Supprimer le message de confirmation après 3 secondes
            try {
                const replyMessage = await message.reply(`Rôle **${role.name}** retiré de **${target.user.tag}**`);
                setTimeout(() => {
                    replyMessage.delete().catch(console.error);
                }, 3000);
            } catch (error) {
                console.error('Erreur message confirmation delrole:', error);
            }
        } catch (error) {
            console.error('[DELROLE ERROR] Erreur complète:', error);
            
            if (error.code === 50013) {
                return;
            } else {
                return;
            }
        }
    }
};
