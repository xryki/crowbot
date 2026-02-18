const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'unmute',
    description: 'Démute membre',
    permissions: PermissionsBitField.Flags.ModerateMembers,
    async execute(message, args, client) {
        console.log(`[UNMUTE] Commande exécutée par ${message.author.tag}`);
        
        // Vérifier les permissions du bot
        if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
            return message.reply('Je n\'ai pas la permission "Moderate Members".');
        }
        
        // Vérifier les permissions de l'utilisateur - bypass pour le développeur
        if (!client.isDeveloper(message.author.id) && !message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
            return message.reply('Tu n\'as pas la permission "Moderate Members".');
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
        
        console.log(`[UNMUTE] Cible: ${target.user.tag}`);
        
        try {
            // Vérifier si le bot peut gérer cet utilisateur
            if (!target.manageable) {
                return message.reply('Je ne peux pas gérer cet utilisateur.');
            }
            
            // Vérifier si l'utilisateur peut unmute cette personne - bypass pour les owners
            if (!client.isDeveloper(message.author.id) && 
                target.roles.highest.position >= message.member.roles.highest.position && 
                message.member.id !== message.guild.ownerId) {
                return message.reply('Tu ne peux pas **timeout** cet utilisateur.');
            }
            
            await target.timeout(null);
            const replyMessage = await message.reply(`${target.user.tag} n'est plus **timeout**`);
            
            // Supprimer le message du bot après 5 secondes
            setTimeout(() => {
                replyMessage.delete().catch(console.error);
            }, 5000);
            
            // Envoyer les logs
            await client.sendLog(message.guild, 'Unmute', message.member, target, 'Timeout retiré');
        } catch (error) {
            console.error('[UNMUTE ERROR] Erreur complète:', error);
            
            if (error.code === 50013) {
                message.reply('Permission refusée.');
            } else {
                message.reply('Erreur lors du démute.');
            }
        }
    }
};
