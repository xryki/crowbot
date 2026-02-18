const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'cmute',
    description: 'Rend muet un utilisateur dans le salon textuel actuel uniquement',
    permissions: PermissionsBitField.Flags.ManageChannels,
    async execute(message, args, client) {
        console.log(`[CMUTE] Commande exécutée par ${message.author.tag} dans ${message.guild.name} - ${message.channel.name}`);
        
        // Vérifier les permissions du bot
        if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            console.log(`[CMUTE ERROR] Bot n'a pas la permission ManageChannels`);
            return message.reply('Je n\'ai pas la permission de gérer les salons.');
        }
        
        // Vérifier si l'utilisateur a la permission de gérer les salons - bypass pour le développeur
        if (!client.isDeveloper(message.author.id) && !message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            console.log(`[CMUTE ERROR] ${message.author.tag} n'a pas la permission ManageChannels`);
            return message.reply('Vous n\'avez pas la permission de rendre muet les membres.');
        }
        
        const targetUser = message.mentions.members.first();
        if (!targetUser) {
            console.log(`[CMUTE ERROR] Aucune cible spécifiée`);
            return message.reply('Veuillez mentionner un utilisateur à rendre muet.');
        }
        
        console.log(`[CMUTE] Cible: ${targetUser.user.tag} (${targetUser.id})`);
        
        try {
            // Vérifier si le bot peut gérer cet utilisateur
            if (!targetUser.manageable) {
                console.log(`[CMUTE ERROR] Bot ne peut pas gérer ${targetUser.user.tag} - rôle supérieur`);
                return message.reply('Je ne peux pas gérer cet utilisateur (rôle supérieur).');
            }
            
            // Vérifier si l'utilisateur peut mute cette personne - bypass pour les owners
            if (!client.isDeveloper(message.author.id) && 
                targetUser.roles.highest.position >= message.member.roles.highest.position && 
                message.member.id !== message.guild.ownerId) {
                console.log(`[CMUTE ERROR] ${message.author.tag} ne peut pas mute ${targetUser.user.tag} - hiérarchie des rôles`);
                return message.reply('Tu ne peux pas mute cet utilisateur (rôle supérieur ou égal).');
            }
            
            // Vérifier si l'utilisateur est déjà mute dans ce salon
            const existingPerms = message.channel.permissionOverwrites.cache.get(targetUser.id);
            if (existingPerms && existingPerms.deny.has(PermissionsBitField.Flags.SendMessages)) {
                console.log(`[CMUTE] ${targetUser.user.tag} est déjà mute dans ce salon`);
                return message.reply('**Cet utilisateur est déjà muet dans ce salon.**');
            }
            
            console.log(`[CMUTE] Application des permissions de mute...`);
            
            // Appliquer les permissions de mute directement à l'utilisateur
            await message.channel.permissionOverwrites.create(targetUser, {
                SendMessages: false,
                AddReactions: false
            }, 'Mute dans le salon par ' + message.author.tag);
            
            console.log(`[CMUTE] Succès: ${targetUser.user.tag} mute dans ${message.channel.name}`);
            return message.reply(`${targetUser.user.tag} a été rendu muet dans le salon ${message.channel.name}.`);
        } catch (error) {
            console.error('[CMUTE ERROR] Erreur complète:', error);
            
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
