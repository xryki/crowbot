const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'say',
    description: 'Le bot répète votre message en supprimant le vôtre',
    permissions: PermissionsBitField.Flags.ManageMessages,
    async execute(message, args, client) {
        // Vérifier les permissions de l'utilisateur - bypass pour le développeur
        console.log(`[SAY] Vérification permissions - Auteur: ${message.author.id}, Est développeur: ${client.isDeveloper ? client.isDeveloper(message.author.id) : 'FONCTION INEXISTANTE'}`);
        
        if (!client.isDeveloper(message.author.id) && !message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            console.log(`[SAY ERROR] Permission refusée pour ${message.author.tag}`);
            return message.reply('Tu n\'as pas la permission "Manage Messages" pour utiliser cette commande.');
        }
        
        // Vérifier s'il y a un message à répéter
        if (!args[0]) {
            return client.autoDeleteMessage(message.channel, 'Veuillez fournir un message à répéter.');
        }
        
        const messageContent = args.join(' ');
        
        try {
            // Supprimer le message original de l'utilisateur
            await message.delete().catch(() => {});
            
            // Envoyer le message avec le bot
            await message.channel.send(messageContent);
            
        } catch (error) {
            console.error('Erreur commande say:', error);
            
            // Si la suppression échoue, envoyer juste le message
            try {
                await message.channel.send(messageContent);
            } catch (sendError) {
                console.error('Erreur envoi message say:', sendError);
                await client.autoDeleteMessage(message.channel, 'Impossible d\'envoyer le message.');
            }
        }
    }
};
