const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'clear',
    description: 'Supprime X messages (-) ou les messages d\'un utilisateur sur  jours',
    permissions: PermissionsBitField.Flags.ManageMessages,

    async execute(message, args, client) {
        const prefix = client.getPrefix(message.guild.id);
        const MAX_MESSAGES = 100;

        // --- MODE CLEAR UTILISATEUR ---
        const userMention = args[0]?.match(/^<@!?(\d+)>$/);

        if (userMention) {
            const userId = userMention[1];
            const amount = parseInt(args[1]) || MAX_MESSAGES;

            if (amount < 1 || amount > MAX_MESSAGES) {
                return message.reply(`Utilisation: \`${prefix}clear <utilisateur> <1-${MAX_MESSAGES}>\``);
            }

            try {
                let fetched;
                let allMessages = [];
                let lastId = null;

                //  On récupère les messages par paquets de 100 jusqu'à remonter 14 jours ou atteindre le montant demandé
                const fourteenDaysAgo = Date.now() - (14 * 24 * 60 * 60 * 1000);
                let collectedCount = 0;

                do {
                    fetched = await message.channel.messages.fetch({
                        limit: Math.min(100, amount - collectedCount),
                        before: lastId || undefined
                    });

                    const filtered = fetched.filter(msg => msg.createdTimestamp >= fourteenDaysAgo);
                    const userFiltered = filtered.filter(msg => msg.author.id === userId);
                    
                    allMessages.push(...userFiltered.values());
                    collectedCount += userFiltered.size;

                    lastId = fetched.last()?.id;

                } while (fetched.size === 100 && collectedCount < amount);

                if (allMessages.length === 0) {
                    return message.reply("Aucun message de cet utilisateur dans les 14 derniers jours.");
                }

                // Prendre les X plus récents
                const toDelete = allMessages.slice(0, amount);

                await message.channel.bulkDelete(toDelete, true);

                const user = await message.client.users.fetch(userId).catch(() => null);
                const userName = user ? user.username : "Utilisateur inconnu";

                // Ne pas supprimer le message de l'auteur si c'est un clear utilisateur
                if (message.author.id !== userId) {
                    message.channel.send(`${toDelete.length} messages de ${userName} supprimés (sur 14 jours).`)
                        .then(m => setTimeout(() => m.delete(), 5000));
                } else {
                    message.channel.send(`${toDelete.length} messages de ${userName} supprimés (sur 14 jours).`)
                        .then(m => setTimeout(() => m.delete(), 5000));
                }

            } catch (error) {
                console.error("Erreur clear utilisateur:", error);

                if (error.code === 50001) {
                    message.reply("Impossible de supprimer des messages de plus de 14 jours.");
                } else {
                    message.reply("Erreur lors de la suppression des messages.");
                }
            }

            return;
        }

        // --- MODE CLEAR NORMAL ---
        const amount = parseInt(args[0]);
        
        // Si pas d'argument, clear automatique de 50 messages
        if (!amount) {
            try {
                const msgs = await message.channel.bulkDelete(50, true);
                message.channel.send(`${msgs.size} messages supprimés automatiquement.`)
                    .then(m => setTimeout(() => m.delete(), 5000));
            } catch (error) {
                console.error('Erreur clear auto:', error);
                
                if (error.code === 50001) {
                    message.reply('Impossible de supprimer des messages de plus de 14 jours.');
                } else {
                    message.reply('Erreur lors de la suppression automatique des messages.');
                }
            }
            return;
        }
        
        if (amount < 1 || amount > MAX_MESSAGES) {
            return message.reply(`Utilisation: \`${prefix}clear <1-${MAX_MESSAGES}>\``);
        }

        try {
            const msgs = await message.channel.bulkDelete(amount, true);
            message.channel.send(`${msgs.size} messages supprimés.`)
                .then(m => setTimeout(() => m.delete(), 5000));
        } catch (error) {
            console.error("Erreur clear normal:", error);

            if (error.code === 50001) {
                message.reply("Impossible de supprimer des messages de plus de 14 jours.");
            } else {
                message.reply("Erreur lors de la suppression des messages.");
            }
        }
    }
};
