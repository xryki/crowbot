const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'mv',
    description: 'Déplace un utilisateur vers un salon vocal',
    developerOnly: true,
    async execute(message, args, client) {
        const prefix = client.getPrefix(message.guild.id);
        
        // Vérifier si l'utilisateur est le développeur
        if (!client.isDeveloper(message.author.id)) {
            return message.reply('Commande réservée au développeur du bot.');
        }

        if (args.length < 1) {
            return message.reply(`Usage: ${prefix}mv <utilisateur> [salon vocal]`);
        }

        // Vérifier si l'auteur est en vocal pour le mode automatique
        const authorVoiceChannel = message.member.voice.channel;
        let targetChannel = null;

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

        // Si l'auteur est en vocal et qu'un seul argument est fourni, utiliser le salon de l'auteur
        if (authorVoiceChannel && args.length === 1) {
            targetChannel = authorVoiceChannel;
        } else {
            // Sinon, chercher le salon vocal spécifié
            targetChannel = message.mentions.channels.first() || 
                          message.guild.channels.cache.get(args[1]) ||
                          message.guild.channels.cache.find(c => c.name.toLowerCase() === args.slice(1).join(' ').toLowerCase() && c.type === 2);
        }

        if (!targetChannel) {
            return message.reply(`Salon vocal introuvable. Si vous êtes en vocal, utilisez simplement ${prefix}mv <utilisateur>`);
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
