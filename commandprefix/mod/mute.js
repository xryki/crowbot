const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'mute',
    description: 'Mute temporaire (j par défaut, ou temps personnalisé)',
    permissions: PermissionsBitField.Flags.ModerateMembers,
    async execute(message, args, client) {
        // Vérifier les permissions du bot
        if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
            return message.reply('Je n\'ai pas la permission "Moderate Members". Veuillez l\'activer dans les paramètres du serveur.');
        }
        
        // Vérifier les permissions de l'utilisateur - bypass pour les owners
        if (!client.isOwner(message.author.id, message.guild.id) && !message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
            return message.reply('Tu n\'as pas la permission "Moderate Members" pour utiliser cette commande.');
        }
        
        // Récupérer la cible soit par mention, soit par réponse
        let target;
        let timeInput;
        
        if (message.reference) {
            const referencedMessage = await message.channel.messages.fetch(message.reference.messageId);
            target = referencedMessage.member;
            timeInput = args[0]; // En réponse, premier arg = temps
        } else {
            target = message.mentions.members.first();
            timeInput = args[0]; // En mention, deuxième arg = temps
        }
        
        if (!target) return message.reply('Mentionne quelqu\'un ou réponds à son message !');
        
        const times = { 'm': 60000, 'h': 3600000, 'd': 86400000 };
        let duration;
        let displayTime;
        
        if (!timeInput) {
            // 7 jours par défaut si aucun temps spécifié
            duration = 7 * 24 * 60 * 60 * 1000;
            displayTime = 'j';
        } else {
            // Parser le temps personnalisé
            const timeMatch = timeInput.match(/^(\d+)([smhjd])$/i);
            if (!timeMatch) {
                return message.reply('Format invalide ! Exemples: m, h, j, s, d (ou aucun pour j par défaut)');
            }
            
            const amount = parseInt(timeMatch[1]);
            const unit = timeMatch[2].toLowerCase();
            
            const multipliers = {
                's': 1000,                           // seconde
                'j': 86400000,         // jour
                'd': 86400000,         // jour (alternative)
                'h': 3600000,              // heure
                'm': 60000,                   // minute
            };
            
            duration = amount * multipliers[unit];
            displayTime = `${amount}${unit}`;
            
            // Limiter à 14 jours maximum (limite Discord)
            if (duration > 14 * 24 * 60 * 60 * 1000) {
                return message.reply('Durée maximum de 14 jours autorisée !');
            }
        }
        
        try {
            // Vérifier si le bot peut mute cette personne
            if (!target.manageable) {
                console.log(`[MUTE ERROR] Bot ne peut pas gérer l'utilisateur ${target.user.tag} - rôle supérieur`);
                return message.reply('Je ne peux pas mute cet utilisateur.');
            }
            
            // Vérifier si l'utilisateur peut mute cette personne - bypass pour les owners
            if (!client.isOwner(message.author.id, message.guild.id) && 
                target.roles.highest.position >= message.member.roles.highest.position && 
                message.member.id !== message.guild.ownerId) {
                console.log(`[MUTE ERROR] ${message.author.tag} ne peut pas mute ${target.user.tag} - hiérarchie des rôles`);
                return message.reply('Tu ne peux pas mute cet utilisateur.');
            }
            
            await target.timeout(duration);
            
            // Message différent selon si durée spécifiée ou non
            let replyMessage;
            if (!timeInput) {
                replyMessage = await message.reply(`${target.user.tag} a été timeout`);
            } else {
                replyMessage = await message.reply(`${target.user.tag} a été timeout pour ${displayTime}`);
            }
            
            // Supprimer le message du bot après  secondes
            setTimeout(() => {
                replyMessage.delete().catch(console.error);
            }, );
            
            // Envoyer les logs
            await client.sendLog(message.guild, 'Mute', message.member, target, `Durée: ${displayTime}`);
        } catch (error) {
            console.error('[MUTE ERROR] Erreur complète:', error);
            
            // Messages d'erreur simples sur Discord
            if (error.code === 0) {
                console.log(`[MUTE ERROR] Permission manquante - Guild: ${message.guild.name}, User: ${target.user.tag}`);
                message.reply('Permission refusée.');
            } else if (error.code === 0) {
                console.log(`[MUTE ERROR] Utilisateur introuvable - ID: ${target.id}`);
                message.reply('Utilisateur introuvable.');
            } else if (error.code === 0) {
                console.log(`[MUTE ERROR] Cannot send DMs to user ${target.user.tag}`);
                message.reply('Erreur lors du mute.');
            } else {
                console.log(`[MUTE ERROR] Erreur inconnue - Code: ${error.code}, Message: ${error.message}`);
                message.reply('Erreur lors du mute.');
            }
        }
    }
};
