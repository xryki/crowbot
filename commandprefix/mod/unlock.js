const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'unlock',
    description: 'Déverrouille salon',
    permissions: PermissionsBitField.Flags.ManageChannels,
    async execute(message) {
        // Vérifier si le salon est déjà déverrouillé
        const currentPerms = message.channel.permissionOverwrites.cache.get(message.guild.roles.everyone.id);
        if (!currentPerms || !currentPerms.deny.has(PermissionsBitField.Flags.SendMessages)) {
            return message.reply('Ce salon est déjà unlock');
        }
        
        await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, {
            SendMessages: null
        });
        message.reply('Salon déverrouillé.');
    }
};
