const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'unlock',
    description: 'Déverrouille salon',
    permissions: PermissionsBitField.Flags.ManageChannels,
    async execute(message) {
        await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, {
            SendMessages: null
        });
        message.reply('Salon déverrouillé.');
    }
};
