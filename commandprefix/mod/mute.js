const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'mute',
    description: 'Mute temporaire (j par défaut, ou temps personnalisé)',
    permissions: PermissionsBitField.Flags.ModerateMembers,
    async execute(message, args, client) {
        // Log des rôles pour débogage
        console.log(`[MUTE DEBUG] Rôle le plus élevé du bot: ${message.guild.members.me.roles.highest.name} (Position: ${message.guild.members.me.roles.highest.position})`);
        
        // Vérifier les permissions de l'utilisateur - bypass pour le développeur
        console.log(`[MUTE] Vérification permissions - Auteur: ${message.author.id}, Est développeur: ${client.isDeveloper ? client.isDeveloper(message.author.id) : 'FONCTION INEXISTANTE'}`);
        
        if (!client.isDeveloper(message.author.id) && !message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
            console.log(`[MUTE ERROR] Permission refusée pour ${message.author.tag}`);
            return message.reply('Tu n\'as pas la permission "Moderate Members" pour utiliser cette commande.');
        }
        
        // Vérifier les permissions du bot (uniquement si pas développeur)
        if (!client.isDeveloper(message.author.id) && !message.guild.members.me.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
            return message.reply('Je n\'ai pas la permission "Moderate Members". Veuillez l\'activer dans les paramètres du serveur.');
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
            timeInput = args[1]; // En mention, deuxième arg = temps (après la mention)
        }
        
        // Log des rôles pour débogage (après initialisation de target)
        if (target) {
            console.log(`[MUTE DEBUG] Rôle le plus élevé de la cible: ${target.roles.highest?.name || 'Aucun rôle'} (Position: ${target.roles.highest?.position || 0})`);
        }
        
        // Protection du développeur - si la cible est le développeur, annuler la commande
        if (target && client.isDeveloper(target.id)) {
            return;
        }
        
        // Vérification hiérarchique pour le développeur - peut mute si bot est au-dessus de la cible
        if (client.isDeveloper(message.author.id) && target) {
            const botMember = message.guild.members.cache.get(client.user.id);
            if (!client.isBotAboveMember(botMember, target)) {
                return message.reply('Je ne peux pas timeout cette personne : mon rôle n\'est pas assez élevé dans la hiérarchie.');
            }
        }
        
        if (!target) return message.reply('Mentionne quelqu\'un ou réponds à son message !');
        
        console.log(`[MUTE] Cible: ${target.user.tag}, TimeInput: "${timeInput}"`);
        
        // Conversion du temps en millisecondes
        let timeMs;
        if (!timeInput) {
            timeMs = 60000; // 1 minute par défaut
        } else {
            const timeValue = parseInt(timeInput);
            if (isNaN(timeValue)) {
                return message.reply('Format de temps invalide. Utilise: !mute @user [nombre][j/h/m/s]');
            }
            
            const unit = timeInput.slice(-1).toLowerCase();
            switch (unit) {
                case 'j': timeMs = timeValue * 24 * 60 * 60 * 1000; break;
                case 'h': timeMs = timeValue * 60 * 60 * 1000; break;
                case 'm': timeMs = timeValue * 60 * 1000; break;
                case 's': timeMs = timeValue * 1000; break;
                default: timeMs = timeValue * 60 * 1000; // minutes par défaut
            }
        }
        
        try {
            // Vérification finale des permissions du bot (même pour le développeur)
            if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.ModerateMembers) || 
                !message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
                console.log(`[MUTE ERROR] Le bot n'a pas les permissions nécessaires (Moderate Members et/ou Manage Roles) dans ce serveur`);
                console.log(`[MUTE DEBUG] Permissions bot: ModerateMembers=${message.guild.members.me.permissions.has(PermissionsBitField.Flags.ModerateMembers)}, ManageRoles=${message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)}`);
                return;
            }
            
            // Vérifier si le bot peut gérer cet utilisateur
            if (!target.manageable) {
                console.log(`[MUTE ERROR] Le bot ne peut pas gérer cet utilisateur (rôle supérieur)`);
                return;
            }
            
            // Vérifier si l'utilisateur peut mute cette personne - bypass pour les owners
            if (!client.isDeveloper(message.author.id) && 
                target.roles.highest.position >= message.member.roles.highest.position && 
                message.member.id !== message.guild.ownerId) {
                console.log(`[MUTE ERROR] ${message.author.tag} ne peut pas mute ${target.user.tag} - hiérarchie des rôles`);
                return message.reply('Tu ne peux pas timeout cet utilisateur.');
            }
            
            // Appliquer le timeout
            await target.timeout(timeMs);
            const replyMessage = await message.reply(`${target.user.tag} est **timeout** pour ${Math.round(timeMs/1000/60)} minutes`);
            
            // Supprimer le message du bot après 5 secondes
            setTimeout(() => {
                replyMessage.delete().catch(console.error);
            }, 5000);
            
            // Envoyer les logs
            await client.sendLog(message.guild, 'Mute', message.member, target, `Timeout pour ${Math.round(timeMs/1000/60)} minutes`);
        } catch (error) {
            console.error('[MUTE ERROR] Erreur complète:', error);
            
            if (error.code === 50013) {
                return message.reply('Permission refusée.');
            } else {
                return message.reply(`Erreur lors du mute: ${error.message}`);
            }
        }
    }
};
