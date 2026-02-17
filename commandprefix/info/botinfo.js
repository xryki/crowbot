const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'botinfo',
    description: 'Affiche stats du bot',
    async execute(message) {
        const client = message.client;
        const guild = message.guild;
        const uptime = process.uptime();
        
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor((uptime % 86400) / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        
        const embed = new EmbedBuilder()
            .setTitle(`${client.user.username} - Statistiques`)
            .setThumbnail(client.user.displayAvatarURL())
            .addFields(
                { name: 'Serveurs', value: `${client.guilds.cache.size}`, inline: true },
                { name: 'Utilisateurs', value: `${client.users.cache.size.toLocaleString()}`, inline: true },
                { name: 'Channels', value: `${client.channels.cache.size.toLocaleString()}`, inline: true },
                { name: 'Uptime', value: `${days}d ${hours}h ${minutes}m`, inline: true },
                { name: 'Version Node', value: process.version, inline: true },
                { name: 'Version Discord.js', value: require('discord.js').version, inline: true },
                { name: 'Ping WS', value: `${Math.round(client.ws.ping)}ms`, inline: true },
                { name: 'Mémoire', value: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`, inline: true }
            )
            .setColor('0099FF')
            .setFooter({ text: `Demandé par ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
            .setTimestamp();
        
        message.reply({ embeds: [embed] });
    }
};
