const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'clear',
    description: 'Supprime X messages (1-100) ou les messages d\'un utilisateur spécifique',
    permissions: PermissionsBitField.Flags.ManageMessages,
    async execute(message, args) {
        // Limite maximale que vous gérez
        const MAX_MESSAGES = 100; // Modifiez cette valeur comme vous voulez
        
        if (args.length < 1) {
            // Mode: +clear (sans argument) - clear automatique avec la limite par défaut
            try {
                const msgs = await message.channel.bulkDelete(MAX_MESSAGES, true);
                message.channel.send(`${msgs.size} messages supprimés automatiquement.`)
                    .then(m => setTimeout(() => m.delete(), 3000));
            } catch (error) {
                console.error('Erreur clear auto:', error);
                
                // Gérer les erreurs spécifiques de Discord
                if (error.code === 50034) { // Messages trop anciens
                    message.reply('Impossible de supprimer des messages de plus de 14 jours.');
                } else if (error.code === 10008) { // Message inconnu
                    message.reply('Certains messages sont introuvables (peut-être déjà supprimés).');
                } else {
                    message.reply('Erreur lors de la suppression automatique des messages.');
                }
            }
            return;
        }
        
        // Vérifier si le premier argument est une mention d'utilisateur
        const userMention = args[0].match(/^<@!?(\d+)>$/);
        
        if (userMention) {
            // Mode: +clear <utilisateur> <nombre>
            const userId = userMention[1];
            const amount = parseInt(args[1]) || MAX_MESSAGES; // Si pas de nombre, utilise la limite par défaut
            
            if (amount < 1 || amount > MAX_MESSAGES) {
                return message.reply(`Utilisation: \`+clear <utilisateur> <1-${MAX_MESSAGES}>\``);
            }
            
            try {
                // Récupérer les messages du salon
                const messages = await message.channel.messages.fetch({ limit: 100 });
                
                // Filtrer les messages de l'utilisateur spécifié
                const userMessages = messages.filter(msg => msg.author.id === userId);
                
                // Prendre les X derniers messages de cet utilisateur
                const messagesToDelete = userMessages.first(amount);
                
                if (messagesToDelete.size === 0) {
                    return message.reply('Aucun message trouvé de cet utilisateur dans les 100 derniers messages.');
                }
                
                // Supprimer les messages
                await message.channel.bulkDelete(messagesToDelete, true);
                
                const user = await message.client.users.fetch(userId).catch(() => null);
                const userName = user ? user.username : 'Utilisateur inconnu';
                
                message.channel.send(`${messagesToDelete.size} messages de ${userName} supprimés.`)
                    .then(m => setTimeout(() => m.delete(), 3000));
                    
            } catch (error) {
                console.error('Erreur clear utilisateur:', error);
                
                // Gérer les erreurs spécifiques de Discord
                if (error.code === 50034) { // Messages trop anciens
                    message.reply('Impossible de supprimer des messages de plus de 14 jours.');
                } else if (error.code === 10008) { // Message inconnu
                    message.reply('Certains messages sont introuvables (peut-être déjà supprimés).');
                } else {
                    message.reply('Erreur lors de la suppression des messages de cet utilisateur.');
                }
            }
            
        } else {
            // Mode: +clear <nombre> (fonctionnalité originale)
            const amount = parseInt(args[0]);
            if (amount < 1 || amount > MAX_MESSAGES) {
                return message.reply(`Utilisation: \`+clear <1-${MAX_MESSAGES}>\``);
            }
            
            try {
                const msgs = await message.channel.bulkDelete(amount, true);
                message.channel.send(`${msgs.size} messages supprimés.`)
                    .then(m => setTimeout(() => m.delete(), 3000));
            } catch (error) {
                console.error('Erreur clear normal:', error);
                
                // Gérer les erreurs spécifiques de Discord
                if (error.code === 50034) { // Messages trop anciens
                    message.reply('Impossible de supprimer des messages de plus de 14 jours.');
                } else if (error.code === 10008) { // Message inconnu
                    message.reply('Certains messages sont introuvables (peut-être déjà supprimés).');
                } else {
                    message.reply('Erreur lors de la suppression des messages.');
                }
            }
        }
    }
};
