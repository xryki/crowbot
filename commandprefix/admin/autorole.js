const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'autorole',
    description: 'Configure rôle auto pour nouveaux membres',
    permissions: PermissionsBitField.Flags.Administrator,
    async execute(message, args, client) {
        const role = message.mentions.roles.first();
        if (!role) return message.reply('Mentionne un rôle !');
        
        client.autorole = client.autorole || {};
        client.autorole[message.guild.id] = role.id;
        
        message.reply(`Rôle auto configuré: **${role.name}**`);
    }
};
