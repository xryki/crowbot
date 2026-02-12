const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'mute',
    description: 'Mute temporaire (28j par défaut, ou temps personnalisé)',
    permissions: PermissionsBitField.Flags.ModerateMembers,
    async execute(message, args, client) {
        // Vérifier les permissions du bot
        if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
            return message.reply('Je n\'ai pas la permission "Moderate Members". Veuillez l\'activer dans les paramètres du serveur.');
        }
        
        // Vérifier les permissions de l'utilisateur
        if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
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
            timeInput = args[1]; // En mention, deuxième arg = temps
        }
        
        if (!target) return message.reply('Mentionne quelqu\'un ou réponds à son message !');
        
        const times = { '1m': 60*1000, '5m': 5*60*1000, '1h': 3600000, '1d': 86400000 };
        let duration;
        let displayTime;
        
        if (!timeInput) {
            // 28 jours par défaut si aucun temps spécifié
            duration = 28 * 24 * 60 * 60 * 1000;
            displayTime = '28j';
        } else {
            // Parser le temps personnalisé
            const timeMatch = timeInput.match(/^(\d+)([smhjd])$/i);
            if (!timeMatch) {
                return message.reply('Format invalide ! Exemples: 30m, 2h, 3j, 1s, 5d (ou aucun pour 28j par défaut)');
            }
            
            const amount = parseInt(timeMatch[1]);
            const unit = timeMatch[2].toLowerCase();
            
            const multipliers = {
                's': 1000,                           // seconde
                'j': 24 * 60 * 60 * 1000,         // jour
                'd': 24 * 60 * 60 * 1000,         // jour (alternative)
                'h': 60 * 60 * 1000,              // heure
                'm': 60 * 1000,                   // minute
            };
            
            duration = amount * multipliers[unit];
            displayTime = `${amount}${unit}`;
            
            // Limiter à 1 an maximum
            if (duration > 365 * 24 * 60 * 60 * 1000) {
                return message.reply('Durée maximum de 1 an autorisée !');
            }
        }
        
        try {
            await target.timeout(duration);
            
            // Message différent selon si durée spécifiée ou non
            if (!timeInput) {
                message.reply(`${target.user.tag} a été **timeout**`);
            } else {
                message.reply(`${target.user.tag} a été **timeout** pour ${displayTime}`);
            }
            
            // Envoyer les logs
            await client.sendLog(message.guild, 'Mute', message.member, target, `Durée: ${displayTime}`);
        } catch (error) {
            console.error(error);
            message.reply('Erreur lors du mute.');
        }
    }
};
