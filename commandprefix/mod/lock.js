const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'lock',
    description: 'Verrouille salon (@everyone)',
    permissions: PermissionsBitField.Flags.ManageChannels,
    async execute(message) {
        // Vérifier si le salon est déjà verrouillé
        const currentPerms = message.channel.permissionOverwrites.cache.get(message.guild.roles.everyone.id);
        if (currentPerms && currentPerms.deny.has(PermissionsBitField.Flags.SendMessages)) {
            return message.reply('Ce salon est déjà lock');
        }
        
        await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, {
            SendMessages: false
        });
        message.reply('Salon verrouillé.');
    }
};
