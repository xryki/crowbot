const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'lock',
    description: 'Verrouille salon (@everyone)',
    permissions: PermissionsBitField.Flags.ManageChannels,
    async execute(message) {
        await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, {
            SendMessages: false
        });
        message.reply('Salon verrouillé.');
    }
};
