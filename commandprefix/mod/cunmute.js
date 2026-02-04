const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'cunmute',
    description: 'Redonne la parole à un utilisateur dans le salon textuel actuel uniquement',
    permissions: PermissionsBitField.Flags.ManageChannels,
    async execute(message, args, client) {
        // Vérifier si l'utilisateur a la permission de gérer les salons
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            return message.reply('Vous n\'avez pas la permission de redonner la parole aux membres.');
        }
        
        const targetUser = message.mentions.members.first();
        if (!targetUser) {
            return message.reply('Veuillez mentionner un utilisateur à redonner la parole.');
        }
        
        try {
            // Vérifier si l'utilisateur a des permissions de mute dans ce salon
            const existingPerms = message.channel.permissionOverwrites.cache.get(targetUser.id);
            if (!existingPerms || !existingPerms.deny.has(PermissionsBitField.Flags.SendMessages)) {
                return message.reply('Cet utilisateur n\'est pas muet dans ce salon.');
            }
            
            // Retirer les permissions de mute
            await message.channel.permissionOverwrites.delete(targetUser, 'Unmute dans le salon par ' + message.author.tag);
            
            return message.reply(`${targetUser.user.tag} a retrouvé sa parole dans le salon ${message.channel.name}.`);
        } catch (error) {
            console.error('Erreur cunmute:', error);
            return message.reply('Une erreur est survenue en redonnant la parole à l\'utilisateur.');
        }
    }
};
