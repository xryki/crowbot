const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'prefix',
    description: 'Change le prefix du bot',
    permissions: PermissionsBitField.Flags.Administrator,
    skipLogging: true, // Désactiver les logs automatiques pour cette commande
    async execute(message, args, client) {
        if (!args[0]) {
            const currentPrefix = client.getPrefix(message.guild.id);
            return client.autoDeleteMessage(message.channel, `Prefix actuel: \`${currentPrefix}\``);
        }
        
        if (args[0].length > 10) {
            return client.autoDeleteMessage(message.channel, 'Le prefix ne peut pas dépasser 10 caractères.');
        }
        
        client.prefixes[message.guild.id] = args[0];
        
        // Sauvegarder automatiquement
        client.saveData();
        
        await client.autoDeleteMessage(message.channel, `Prefix changé en \`${args[0]}\``);
    }
};
