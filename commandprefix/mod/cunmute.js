const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'cunmute',
    description: 'Redonne la parole à un utilisateur dans le salon textuel actuel uniquement',
    permissions: PermissionsBitField.Flags.ManageChannels,
    async execute(message, args, client) {
        console.log(`[CUNMUTE] Commande exécutée par ${message.author.tag} dans ${message.guild.name} - ${message.channel.name}`);
        
        // Vérifier les permissions du bot
        if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            console.log(`[CUNMUTE ERROR] Bot n'a pas la permission ManageChannels`);
            return message.reply('Je n\'ai pas la permission de gérer les salons.');
        }
        
        // Vérifier si l'utilisateur a la permission de gérer les salons - bypass pour le développeur
        if (!client.isDeveloper(message.author.id) && !message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            console.log(`[CUNMUTE ERROR] ${message.author.tag} n'a pas la permission ManageChannels`);
            return message.reply('Vous n\'avez pas la permission de redonner la parole aux membres.');
        }
        
        const targetUser = message.mentions.members.first();
        if (!targetUser) {
            console.log(`[CUNMUTE ERROR] Aucune cible spécifiée`);
            return message.reply('Veuillez mentionner un utilisateur à redonner la parole.');
        }
        
        console.log(`[CUNMUTE] Cible: ${targetUser.user.tag} (${targetUser.id})`);
        
        try {
            // Vérifier si l'utilisateur peut unmute cette personne - bypass pour les owners
            if (!client.isDeveloper(message.author.id) && 
                targetUser.roles.highest.position >= message.member.roles.highest.position && 
                message.member.id !== message.guild.ownerId) {
                console.log(`[CUNMUTE ERROR] ${message.author.tag} ne peut pas unmute ${targetUser.user.tag} - hiérarchie des rôles`);
                return message.reply('Tu ne peux pas unmute cet utilisateur (rôle supérieur ou égal).');
            }
            
            // Vérifier si l'utilisateur a des permissions de mute dans ce salon
            const existingPerms = message.channel.permissionOverwrites.cache.get(targetUser.id);
            if (!existingPerms || !existingPerms.deny.has(PermissionsBitField.Flags.SendMessages)) {
                console.log(`[CUNMUTE] ${targetUser.user.tag} n'est pas mute dans ce salon`);
                return message.reply('Cet utilisateur n\'est pas muet dans ce salon.');
            }
            
            console.log(`[CUNMUTE] Suppression des permissions de mute...`);
            
            // Retirer les permissions de mute
            await message.channel.permissionOverwrites.delete(targetUser, 'Unmute dans le salon par ' + message.author.tag);
            
            console.log(`[CUNMUTE] Succès: ${targetUser.user.tag} unmute dans ${message.channel.name}`);
            return message.reply(`${targetUser.user.tag} a retrouvé sa parole dans le salon ${message.channel.name}.`);
        } catch (error) {
            console.error('[CUNMUTE ERROR] Erreur complète:', error);
            
            // Messages d'erreur détaillés
            if (error.code === 50013) {
                return message.reply('Permission refusée - vérifie que j\'ai les permissions nécessaires.');
            } else if (error.code === 10013) {
                return message.reply('Utilisateur introuvable.');
            } else {
                return message.reply(`Une erreur est survenue: ${error.message}`);
            }
        }
    }
};
