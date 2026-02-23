const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'addrole',
    description: 'Ajoute rôle par nom texte',
    permissions: PermissionsBitField.Flags.ManageRoles,
    async execute(message, args, client) {
        console.log(`[ADDROLE] Commande exécutée par ${message.author.tag} avec args:`, args);
        
        // Actualiser le cache des rôles pour détecter les nouveaux rôles
        await message.guild.roles.fetch();
        
        // Vérifier si l'utilisateur a les permissions nécessaires (Manage Roles ou Administrator) - bypass pour le développeur
        console.log(`[ADDROLE] Vérification permissions - Auteur: ${message.author.id}, Est développeur: ${client.isDeveloper ? client.isDeveloper(message.author.id) : 'FONCTION INEXISTANTE'}`);
        
        if (!client.isDeveloper(message.author.id) && 
            !message.member.permissions.has(PermissionsBitField.Flags.ManageRoles) && 
            !message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            console.log(`[ADDROLE ERROR] Permission refusée pour ${message.author.tag}`);
            return; // Silence total
        }
        
        // Vérifier les permissions du bot (uniquement si pas développeur)
        if (!client.isDeveloper(message.author.id) && !message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
            return; // Silence total
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
            return; // Silence total
        }
        
        // Vérification hiérarchique pour le développeur - peut addrole si bot est au-dessus de la cible
        if (client.isDeveloper(message.author.id) && target) {
            const botMember = message.guild.members.cache.get(client.user.id);
            if (!client.isBotAboveMember(botMember, target)) {
                return message.reply('Je ne peux pas ajouter un rôle à cette personne : mon rôle n\'est pas assez élevé dans la hiérarchie.');
            }
        }
        
        console.log(`[ADDROLE] Target: ${target?.user?.tag}, RoleName: "${roleName}"`);
        
        // Vérifier si target et roleName sont valides
        if (!target || !roleName) {
            console.log(`[ADDROLE] Target ou roleName manquant`);
            return; // Silence total
        }
        
        // Vérifier les permissions du bot
        if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
            return; // Silence total
        }
        
        // Recherche rôle - d'abord par mention, puis par nom
        let role;
        
        // Vérifier si c'est une mention de rôle
        const roleMention = message.mentions.roles.first();
        if (roleMention) {
            role = roleMention;
            console.log(`[ADDROLE] Rôle trouvé par mention: ${role.name}`);
        } else {
            // Recherche par nom insensible à la casse
            console.log(`[ADDROLE] Tous les rôles disponibles:`, message.guild.roles.cache.map(r => r.name).join(', '));
            
            role = message.guild.roles.cache.find(r => 
                r.name.toLowerCase() === roleName.toLowerCase()
            );
            
            console.log(`[ADDROLE] Rôle recherché par nom: "${roleName}", Trouvé: ${role ? role.name : 'NON'}`);
        }
        
        console.log(`[ADDROLE] Rôle final: ${role ? role.name : 'NON'}, Nombre total de rôles: ${message.guild.roles.cache.size}`);
        
        if (!role) {
            // Afficher les rôles disponibles pour aider
            const availableRoles = message.guild.roles.cache.map(r => r.name).join(', ');
            console.log(`[ADDROLE] Rôles disponibles: ${availableRoles}`);
            return; // Silence total
        }
        
        try {
            // Vérifier si le bot peut gérer ce rôle
            if (role.position >= message.guild.members.me.roles.highest.position) {
            return; // Silence total
            }
            
            // Vérifier si l'utilisateur peut gérer ce rôle - bypass pour les owners
            if (!client.isDeveloper(message.author.id) && 
                role.position >= message.member.roles.highest.position && 
                message.member.id !== message.guild.ownerId) {
            return; // Silence total
            }
            
            await target.roles.add(role);
            
            // Envoyer les logs
            await client.sendLog(message.guild, 'AddRole', message.member, target, `Rôle: ${role.name}`);
            
            // Supprimer le message de confirmation après 3 secondes
            try {
                const replyMessage = await message.reply(`Rôle **${role.name}** ajouté à **${target.user.tag}**`);
                setTimeout(() => {
                    replyMessage.delete().catch(console.error);
                }, 3000);
            } catch (error) {
                console.error('Erreur message confirmation addrole:', error);
            }
        } catch (error) {
            console.error('[ADDROLE ERROR] Erreur complète:', error);
            
            // Messages d'erreur détaillés
            if (error.code === 50013) {
            return; // Silence total
            } else {
            return; // Silence total
            }
        }
    }
};
