const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'unlocknameall',
    description: 'Déverrouille tous les pseudos des utilisateurs présents sur le serveur',
    permissions: PermissionsBitField.Flags.ManageNicknames,
    async execute(message, args, client) {
        // Vérifier les permissions de l'utilisateur - bypass pour le développeur
        console.log(`[UNLOCKNAMEALL] Vérification permissions - Auteur: ${message.author.id}, Est développeur: ${client.isDeveloper ? client.isDeveloper(message.author.id) : 'FONCTION INEXISTANTE'}`);
        
        if (!client.isDeveloper(message.author.id) && !message.member.permissions.has(PermissionsBitField.Flags.ManageNicknames)) {
            console.log(`[UNLOCKNAMEALL ERROR] Permission refusée pour ${message.author.tag}`);
            return message.reply('Tu n\'as pas la permission "ManageNicknames" pour utiliser cette commande.');
        }
        

        try {
            // Vérifier si des pseudos sont lockés
            if (!client.lockedNames || client.lockedNames.size === 0) {
                return message.reply('pas de pseudo lock ici');
            }
            
            let unlockedCount = 0;
            const usersToUnlock = [];
            
            // Parcourir tous les pseudos lockés
            for (const [userId, lockData] of client.lockedNames.entries()) {
                try {
                    // Vérifier si l'utilisateur est sur ce serveur
                    const member = message.guild.members.cache.get(userId);
                    if (!member) {
                        continue; // Ignorer les utilisateurs qui ne sont pas sur ce serveur
                    }
                    
                    usersToUnlock.push({
                        member: member,
                        lockData: lockData
                    });
                } catch (error) {
                    console.error(`Erreur traitement utilisateur ${userId}:`, error);
                }
            }
            
            // Vérifier s'il y a des utilisateurs à déverrouiller sur ce serveur
            if (usersToUnlock.length === 0) {
                return message.reply('pas de pseudo lock ici');
            }
            
            // Déverrouiller tous les utilisateurs
            for (const { member, lockData } of usersToUnlock) {
                try {
                    // Remettre l'ancien pseudo
                    await member.setNickname(lockData.originalName);
                    
                    // Retirer le lock
                    client.lockedNames.delete(member.id);
                    
                    unlockedCount++;
                } catch (error) {
                    console.error(`Erreur unlock de ${member.user.tag}:`, error);
                }
            }
            
            // Sauvegarder automatiquement
            client.saveData();
            
            // Envoyer le message de confirmation
            await message.reply('tout les pseudos sont unlock');
            
        } catch (error) {
            console.error('Erreur dans la commande unlocknameall:', error);
            return message.reply('Une erreur est survenue lors du déverrouillage des pseudos.');
        }
    }
};
