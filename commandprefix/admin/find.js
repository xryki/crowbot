const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'find',
    description: 'Trouve un utilisateur dans les salons vocaux',
    permissions: PermissionsBitField.Flags.ViewChannel,
    async execute(message, args, client) {
        // Vérifier si l'utilisateur est owner (global ou serveur)
        if (!client.isOwner(message.author.id, message.guild.id)) {
            return message.reply('Commande réservée aux owners du bot.');
        }

        if (!args[0]) {
            return message.reply('Usage: !find <utilisateur>');
        }

        // Récupérer l'utilisateur à trouver
        const targetUser = message.mentions.members.first() || 
                          message.guild.members.cache.get(args[0]) ||
                          message.guild.members.cache.find(m => m.user.username.toLowerCase() === args[0].toLowerCase());

        if (!targetUser) {
            return message.reply('Utilisateur introuvable sur ce serveur.');
        }

        // Vérifier si l'utilisateur est en vocal
        if (!targetUser.voice.channel) {
            return message.reply(`${targetUser.user.tag} n'est pas dans un salon vocal.`);
        }

        const voiceChannel = targetUser.voice.channel;
        const channelMembers = voiceChannel.members.size;
        
        // Créer un embed pour afficher les informations
        const embed = {
            color: x,
            title: `Utilisateur trouvé`,
            description: `${targetUser.user.tag} est dans un salon vocal`,
            fields: [
                {
                    name: ' Salon vocal',
                    value: `${voiceChannel.name}`,
                    inline: true
                },
                {
                    name: ' Nombre de personnes',
                    value: `${channelMembers}/${voiceChannel.userLimit || '∞'}`,
                    inline: true
                },
                {
                    name: ' Muet/Casqué',
                    value: `${targetUser.voice.mute ? 'Muet' : 'Parlant'}: ${targetUser.voice.mute ? 'Oui' : 'Non'}\n${targetUser.voice.deaf ? 'Casqué' : 'Écoute'}: ${targetUser.voice.deaf ? 'Oui' : 'Non'}`,
                    inline: false
                }
            ],
            timestamp: new Date().toISOString()
        };

        // Si d'autres personnes sont dans le salon, les lister
        if (channelMembers > 1) {
            const otherMembers = voiceChannel.members
                .filter(m => m.id !== targetUser.id)
                .map(m => `${m.user.tag}`)
                .join('\n');
            
            embed.fields.push({
                name: 'Autres personnes dans le salon',
                value: otherMembers || 'Aucune',
                inline: false
            });
        }

        message.channel.send({ embeds: [embed] });
    }
};
