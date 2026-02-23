const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'unlockname',
    description: 'Déverrouille le pseudo d\'un utilisateur',
    permissions: PermissionsBitField.Flags.ManageNicknames,
    async execute(message, args, client) {
        // Vérifier les permissions de l'utilisateur - bypass pour le développeur
        console.log(`[UNLOCKNAME] Vérification permissions - Auteur: ${message.author.id}, Est développeur: ${client.isDeveloper ? client.isDeveloper(message.author.id) : 'FONCTION INEXISTANTE'}`);
        
        if (!client.isDeveloper(message.author.id) && !message.member.permissions.has(PermissionsBitField.Flags.ManageNicknames)) {
            console.log(`[UNLOCKNAME ERROR] Permission refusée pour ${message.author.tag}`);
            return message.reply('Tu n\'as pas la permission "ManageNicknames" pour utiliser cette commande.');
        }
        
        // Vérifier les permissions du bot (uniquement si pas développeur)
        if (!client.isDeveloper(message.author.id) && !message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageNicknames)) {
            return message.reply('Je n\'ai pas la permission "ManageNicknames".');
        }

        // Vérifier les arguments
        if (!args[0]) {
            return client.autoDeleteMessage(message.channel, `Usage: ${client.getPrefix(message.guild.id)}unlockname @utilisateur`);
        }
        
        const target = message.mentions.members.first();
        if (!target) {
            return client.autoDeleteMessage(message.channel, 'Veuillez mentionner un utilisateur valide.');
        }
        
        // Protection du développeur - si la cible est le développeur, annuler la commande
        if (target && client.isDeveloper(target.id)) {
            return;
        }
        
        // Vérification hiérarchique pour le développeur - peut unlockname si bot est au-dessus de la cible
        if (client.isDeveloper(message.author.id) && target) {
            const botMember = message.guild.members.cache.get(client.user.id);
            if (!client.isBotAboveMember(botMember, target)) {
                return client.autoDeleteMessage(message.channel, 'Je ne peux pas déverrouiller le pseudo de cette personne : mon rôle n\'est pas assez élevé dans la hiérarchie.');
            }
        }
        
        // Vérifier si le pseudo est locké
        if (!client.lockedNames || !client.lockedNames.has(target.id)) {
            return client.autoDeleteMessage(message.channel, `Le pseudo de <@${target.id}> n'est pas verrouillé.`);
        }
        
        try {
            // Récupérer l'ancien pseudo
            const lockData = client.lockedNames.get(target.id);
            const originalName = lockData.originalName;
            
            // Retirer le lock
            client.lockedNames.delete(target.id);
            
            // Sauvegarder automatiquement
            client.saveData();
            
            // Remettre l'ancien pseudo
            await target.setNickname(originalName);
            
            await client.autoDeleteMessage(message.channel, `Le pseudo de <@${target.id}> a été déverrouillé et remis sur "${originalName}"`);
            
        } catch (error) {
            console.error('Erreur unlockname:', error);
            await client.autoDeleteMessage(message.channel, 'Une erreur est survenue lors du déverrouillage du pseudo.');
        }
    }
};
