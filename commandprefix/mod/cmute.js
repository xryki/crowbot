const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'cmute',
    description: 'Rend muet un utilisateur dans le salon textuel actuel uniquement',
    permissions: PermissionsBitField.Flags.ManageChannels,
    async execute(message, args, client) {
        // Vérifier si l'utilisateur a la permission de gérer les salons
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            return message.reply('Vous n\'avez pas la permission de rendre muet les membres.');
        }
        
        const targetUser = message.mentions.members.first();
        if (!targetUser) {
            return message.reply('Veuillez mentionner un utilisateur à rendre muet.');
        }
        
        try {
            // Vérifier si l'utilisateur est déjà mute dans ce salon
            const existingPerms = message.channel.permissionOverwrites.cache.get(targetUser.id);
            if (existingPerms && existingPerms.deny.has(PermissionsBitField.Flags.SendMessages)) {
                return message.reply('Cet utilisateur est déjà muet dans ce salon.');
            }
            
            // Appliquer les permissions de mute directement à l'utilisateur
            await message.channel.permissionOverwrites.create(targetUser, {
                SendMessages: false,
                AddReactions: false
            }, 'Mute dans le salon par ' + message.author.tag);
            
            return message.reply(`${targetUser.user.tag} a été rendu muet dans le salon ${message.channel.name}.`);
        } catch (error) {
            console.error('Erreur cmute:', error);
            return message.reply('Une erreur est survenue en rendant muet l\'utilisateur.');
        }
    }
};
