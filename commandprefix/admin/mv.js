const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'mv',
    description: 'Déplace un utilisateur vers un salon vocal',
    permissions: PermissionsBitField.Flags.MoveMembers,
    async execute(message, args, client) {
        // Vérifier si l'utilisateur est owner (global ou serveur)
        if (!client.isOwner(message.author.id, message.guild.id)) {
            return message.reply('Commande réservée aux owners du bot.');
        }

        if (args.length < 2) {
            return message.reply('Usage: !mv <utilisateur> <salon vocal>');
        }

        // Récupérer l'utilisateur à déplacer
        const targetUser = message.mentions.members.first() || 
                          message.guild.members.cache.get(args[0]) ||
                          message.guild.members.cache.find(m => m.user.username.toLowerCase() === args[0].toLowerCase());

        if (!targetUser) {
            return message.reply('Utilisateur introuvable.');
        }

        if (!targetUser.voice.channel) {
            return message.reply('Cet utilisateur n\'est pas dans un salon vocal.');
        }

        // Récupérer le salon vocal de destination
        const targetChannel = message.mentions.channels.first() || 
                              message.guild.channels.cache.get(args[1]) ||
                              message.guild.channels.cache.find(c => c.name.toLowerCase() === args.slice(1).join(' ').toLowerCase() && c.type === 2);

        if (!targetChannel) {
            return message.reply('Salon vocal introuvable.');
        }

        if (targetChannel.type !== 2) {
            return message.reply('Le salon spécifié n\'est pas un salon vocal.');
        }

        try {
            await targetUser.voice.setChannel(targetChannel);
            message.reply(` ${targetUser.user.tag} a été déplacé vers ${targetChannel.name}`);
        } catch (error) {
            console.error('Erreur lors du déplacement:', error);
            message.reply(' Impossible de déplacer cet utilisateur. Vérifiez que j\'ai les permissions nécessaires.');
        }
    }
};
