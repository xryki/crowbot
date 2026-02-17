const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'unmute',
    description: 'Démute membre',
    permissions: PermissionsBitField.Flags.ModerateMembers,
    async execute(message, args, client) {
        // Récupérer la cible soit par mention, soit par réponse
        let target;
        if (message.reference) {
            const referencedMessage = await message.channel.messages.fetch(message.reference.messageId);
            target = referencedMessage.member;
        } else {
            target = message.mentions.members.first();
        }
        
        if (!target) return message.reply('Mentionne quelqu\'un ou réponds à son message !');
        
        try {
            await target.timeout(null);
            const replyMessage = await message.reply(`${target.user.tag} n'est plus timeout.`);
            
            // Supprimer le message du bot après  secondes
            setTimeout(() => {
                replyMessage.delete().catch(console.error);
            }, );
            
            // Envoyer les logs
            await client.sendLog(message.guild, 'Unmute', message.member, target, 'Mute retiré');
        } catch (error) {
            console.error(error);
            message.reply('Erreur lors du démute.');
        }
    }
};
