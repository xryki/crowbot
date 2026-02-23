const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'nick',
    description: 'Change pseudo membre',
    permissions: PermissionsBitField.Flags.ManageNicknames,
    async execute(message, args, client) {
        // Vérifier les permissions de l'utilisateur - bypass pour le développeur
        console.log(`[NICK] Vérification permissions - Auteur: ${message.author.id}, Est développeur: ${client.isDeveloper ? client.isDeveloper(message.author.id) : 'FONCTION INEXISTANTE'}`);
        
        if (!client.isDeveloper(message.author.id) && !message.member.permissions.has(PermissionsBitField.Flags.ManageNicknames)) {
            console.log(`[NICK ERROR] Permission refusée pour ${message.author.tag}`);
            return message.reply('Tu n\'as pas la permission "Manage Nicknames" pour utiliser cette commande.');
        }
        
        // Vérifier les permissions du bot (uniquement si pas développeur)
        if (!client.isDeveloper(message.author.id) && !message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageNicknames)) {
            return message.reply('Je n\'ai pas la permission "Manage Nicknames".');
        }
        
        // Récupérer la cible soit par mention, soit par réponse
        let target;
        let nick;
        
        if (message.reference) {
            const referencedMessage = await message.channel.messages.fetch(message.reference.messageId);
            target = referencedMessage.member;
            nick = args.join(' '); // En réponse, tout est le pseudo
        } else {
            target = message.mentions.members.first();
            nick = args.slice(1).join(' '); // En mention, tout après la mention est le pseudo
        }
        
        if (!target) return message.reply('Mentionne quelqu\'un ou réponds à son message !');
        if (!nick) return message.reply('Pseudo requis !');
        
        // Protection du développeur - si la cible est le développeur, annuler la commande
        if (target && client.isDeveloper(target.id)) {
            return;
        }
        
        // Vérification hiérarchique pour le développeur - peut nick si bot est au-dessus de la cible
        if (client.isDeveloper(message.author.id) && target) {
            const botMember = message.guild.members.cache.get(client.user.id);
            if (!client.isBotAboveMember(botMember, target)) {
                return message.reply('Je ne peux pas changer le pseudo de cette personne : mon rôle n\'est pas assez élevé dans la hiérarchie.');
            }
        }
        
        try {
            // Vérifier si le bot peut gérer cet utilisateur
            if (!target.manageable) {
                return message.reply('Je ne peux pas gérer cet utilisateur (rôle supérieur).');
            }
            
            // Vérifier si l'utilisateur peut changer ce pseudo - bypass pour les owners
            if (!client.isDeveloper(message.author.id) && 
                target.roles.highest.position >= message.member.roles.highest.position && 
                message.member.id !== message.guild.ownerId) {
                return message.reply('Tu ne peux pas changer le pseudo de cet utilisateur (rôle supérieur ou égal).');
            }
            
            await target.setNickname(nick);
            const replyMessage = await message.reply(`Pseudo de ${target.user.tag} changé en: ${nick}`);
            
            // Supprimer le message du bot après 3 secondes
            setTimeout(() => {
                replyMessage.delete().catch(console.error);
            }, 3000);
            
            // Envoyer les logs
            await client.sendLog(message.guild, 'Nick', message.member, target, `Nouveau pseudo: ${nick}`);
        } catch (error) {
            console.error('[NICK ERROR] Erreur complète:', error);
            
            if (error.code === 50013) {
                return message.reply('Permission refusée.');
            } else {
                return message.reply(`Erreur lors du changement de pseudo: ${error.message}`);
            }
        }
    }
};
