const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'setup',
    description: 'Configure automatiquement tous les canaux de logs',
    permissions: PermissionsBitField.Flags.Administrator,
    async execute(message, args, client) {
        const channel = message.mentions.channels.first() || message.channel;
        
        client.config = client.config || {};
        client.config[message.guild.id] = client.config[message.guild.id] || {};
        
        // Configurer automatiquement tous les types de logs
        client.config[message.guild.id].modLogs = channel.id;
        client.config[message.guild.id].vocalLogs = channel.id;
        client.config[message.guild.id].roleLogs = channel.id;
        client.config[message.guild.id].chatLogs = channel.id;
        
        // Sauvegarder automatiquement
        client.saveData();
        
        message.reply(`Tous les logs configurés dans: ${channel}`);
        
        // Envoyer les logs
        await client.sendCommandLog(message.guild, { name: 'setup', description: this.description }, message.author, [channel.name]);
    }
};
