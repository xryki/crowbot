const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'unbanall',
    description: 'Unbannit tous les utilisateurs du serveur',
    async execute(message, args, client) {
        // Vérifier si c'est un owner du bot
        if (!client.isOwner(message.author.id, message.guild.id)) {
            return message.reply('Cette commande est réservée aux owners du bot.');
        }
        
        // Vérifier les permissions Discord (Administrateur requis)
        if (!message.member.permissions.has('Administrator')) {
            return message.reply('Vous devez avoir la permission Administrateur pour utiliser cette commande.');
        }
        
        try {
            // Récupérer la liste des bans
            const bans = await message.guild.bans.fetch();
            
            if (bans.size === 0) {
                return message.reply('Il n\'y a aucun utilisateur banni sur ce serveur.');
            }
            
            // Commencer l'unban automatique
            await message.reply(`Début de l\'unban de ${bans.size} utilisateur(s)...`);
            
            let unbannedCount = 0;
            let errors = [];
            
            // Unban tous les utilisateurs
            for (const ban of bans.values()) {
                try {
                    await message.guild.members.unban(ban.user.id, 'Unbanall par ' + message.author.tag);
                    unbannedCount++;
                    
                    // Attendre un peu entre chaque unban pour éviter les rate limits
                    await new Promise(resolve => setTimeout(resolve, 100));
                } catch (error) {
                    errors.push(`Impossible d'unban ${ban.user.tag}: ${error.message}`);
                }
            }
            
            // Envoyer le résultat
            let resultMessage = `Unban terminé !\n${unbannedCount} utilisateur(s) unban(s) avec succès`;
            
            if (errors.length > 0) {
                resultMessage += `\n${errors.length} erreur(s):\n${errors.slice(0, 5).join('\n')}`;
                if (errors.length > 5) {
                    resultMessage += `\n... et ${errors.length - 5} autres erreurs`;
                }
            }
            
            return message.reply(resultMessage);
            
        } catch (error) {
            console.error('Erreur unbanall:', error);
            return message.reply('Une erreur est survenue en récupérant la liste des bans.');
        }
    }
};
