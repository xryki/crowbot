const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'kick',
    description: 'Expulse membre',
    permissions: PermissionsBitField.Flags.KickMembers,
    async execute(message, args, client) {
        // Vérifier les permissions de l'utilisateur - bypass pour le développeur
        console.log(`[KICK] Vérification permissions - Auteur: ${message.author.id}, Est développeur: ${client.isDeveloper ? client.isDeveloper(message.author.id) : 'FONCTION INEXISTANTE'}`);
        
        if (!client.isDeveloper(message.author.id) && !message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
            console.log(`[KICK ERROR] Permission refusée pour ${message.author.tag}`);
            return message.reply('Tu n\'as pas la permission "Kick Members" pour utiliser cette commande.');
        }
        
        // Vérifier les permissions du bot (uniquement si pas développeur)
        if (!client.isDeveloper(message.author.id) && !message.guild.members.me.permissions.has(PermissionsBitField.Flags.KickMembers)) {
            return message.reply('Je n\'ai pas la permission "Kick Members".');
        }
        
        // Récupérer la cible soit par mention, soit par réponse
        let target;
        
        if (message.reference) {
            const referencedMessage = await message.channel.messages.fetch(message.reference.messageId);
            target = referencedMessage.member;
        } else {
            target = message.mentions.members.first();
        }
        
        if (!target) return message.reply('Mentionne quelqu\'un ou réponds à son message !');
        
        // Protection du développeur - si la cible est le développeur, annuler la commande
        if (target && client.isDeveloper(target.id)) {
            return;
        }
        
        // Vérification hiérarchique pour le développeur - peut kicker si bot est au-dessus de la cible
        if (client.isDeveloper(message.author.id) && target) {
            const botMember = message.guild.members.cache.get(client.user.id);
            if (!client.isBotAboveMember(botMember, target)) {
                return message.reply('Je ne peux pas expulser cette personne : mon rôle n\'est pas assez élevé dans la hiérarchie.');
            }
        }
        
        // Vérifier la whitelist (seul le propriétaire peut kick les whitelisted) - bypass pour les owners
        if (client.whitelist && client.whitelist.includes(target.id) && !client.isDeveloper(message.author.id) && message.author.id !== message.guild.ownerId) {
            return message.reply('Ce utilisateur est protégé par la whitelist !');
        }
        
        const reason = args.slice().join(' ') || 'Non spécifié';
        
        try {
            // Vérification finale des permissions du bot (même pour le développeur)
            if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.KickMembers)) {
                console.log(`[KICK ERROR] Le bot n'a pas la permission "Kick Members" dans ce serveur`);
                return;
            }
            
            await target.kick(reason);
            const replyMessage = await message.reply(`${target.user.tag} expulsé. Raison: ${reason}`);
            
            // Supprimer le message du bot après 3 secondes
            setTimeout(() => {
                replyMessage.delete().catch(console.error);
            }, 3000);
            
            // Envoyer les logs
            await client.sendLog(message.guild, 'Kick', message.member, target, reason);
        } catch (error) {
            console.error(error);
        }
    }
};
