module.exports = {
    name: 'bls',
    description: 'Affiche la liste des utilisateurs blacklistés',
    ownerOnly: true,
    async execute(message, args, client) {
        client.blacklist = client.blacklist || [];
        
        if (client.blacklist.length === 0) {
            return message.reply('Aucun utilisateur n\'est blacklisté.');
        }
        
        let listMessage = `**Blacklist (${client.blacklist.length} utilisateur(s))**:\n\n`;
        
        for (let i = 0; i < client.blacklist.length; i++) {
            const userId = client.blacklist[i];
            try {
                const user = await client.users.fetch(userId);
                listMessage += `${i + 1}. ${user.tag} (${userId})\n`;
            } catch (error) {
                listMessage += `${i + 1}. Utilisateur inconnu (${userId})\n`;
            }
        }
        
        // Vérifier si le message est trop long
        if (listMessage.length > 2000) {
            // Envoyer en plusieurs messages si trop long
            const chunks = listMessage.match(/.{1,1900}/g) || [];
            for (const chunk of chunks) {
                await message.reply(chunk);
            }
        } else {
            return message.reply(listMessage);
        }
    }
};
