const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'ban',
    description: 'Bannit membre',
    permissions: PermissionsBitField.Flags.BanMembers,
    async execute(message, args, client) {
        // Vérifier les permissions de l'utilisateur - bypass pour le développeur
        console.log(`[BAN] Vérification permissions - Auteur: ${message.author.id}, Est développeur: ${client.isDeveloper ? client.isDeveloper(message.author.id) : 'FONCTION INEXISTANTE'}`);
        
        if (!client.isDeveloper(message.author.id) && !message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
            console.log(`[BAN ERROR] Permission refusée pour ${message.author.tag}`);
            return message.reply('Tu n\'as pas la permission "Ban Members" pour utiliser cette commande.');
        }
        
        // Vérifier les permissions du bot (uniquement si pas développeur)
        if (!client.isDeveloper(message.author.id) && !message.guild.members.me.permissions.has(PermissionsBitField.Flags.BanMembers)) {
            return message.reply('Je n\'ai pas la permission "Ban Members".');
        }
        
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
        
        if (targetId === message.author.id) return;
        
        // Vérifier la whitelist (seul le propriétaire peut bannir les whitelisted) - bypass pour les owners
        if (client.whitelist && client.whitelist.includes(targetId) && !client.isDeveloper(message.author.id) && message.author.id !== message.guild.ownerId) {
            return message.reply('Cet utilisateur est protégé par la whitelist !');
        }
        
        // Protection du développeur - si la cible est le développeur, annuler la commande
        if (target && client.isDeveloper(target.id)) {
            return;
        }
        
        // Vérification hiérarchique pour le développeur - peut bannir si bot est au-dessus de la cible
        if (client.isDeveloper(message.author.id) && target && target.guild) {
            const botMember = message.guild.members.cache.get(client.user.id);
            if (!client.isBotAboveMember(botMember, target)) {
                return message.reply('Je ne peux pas bannir cette personne : mon rôle n\'est pas assez élevé dans la hiérarchie.');
            }
        }
        
        const reason = args.slice(1).join(' ') || 'Non spécifié';
        
        try {
            // Vérification finale des permissions du bot (même pour le développeur)
            if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.BanMembers)) {
                console.log(`[BAN ERROR] Le bot n'a pas la permission "Ban Members" dans ce serveur`);
                return;
            }
            
            await message.guild.members.ban(targetId, { reason });
            const targetName = target.user ? target.user.tag : `Utilisateur ${targetId}`;
            const replyMessage = await message.reply(`${targetName} banni. Raison: ${reason}`);
            
            // Supprimer le message du bot après 3 secondes
            setTimeout(() => {
                replyMessage.delete().catch(console.error);
            }, 3000);
            
            // Envoyer les logs
            if (message.guild) {
                await client.sendLog(message.guild, 'Ban', message.member, target, reason);
            }
        } catch (error) {
            console.error(error);
            if (message.channel) {
                return message.channel.send('Erreur lors du ban.');
            }
        }
    }
};
