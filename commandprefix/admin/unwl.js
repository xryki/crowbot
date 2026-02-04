const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'unwl',
    description: 'Retire utilisateur de la whitelist',
    ownerOnly: true,
    async execute(message, args, client) {
        client.whitelist = client.whitelist || [];
        const target = message.mentions.users.first();
        
        if (!target) return message.reply('Mentionne un utilisateur !');
        
        if (client.whitelist.includes(target.id)) {
            client.whitelist = client.whitelist.filter(id => id !== target.id);
            message.reply(`${target.tag} retiré de la whitelist.`);
            
            // Envoyer les logs
            await client.sendCommandLog(message.guild, { name: 'unwl', description: this.description }, message.author, [target.tag]);
        } else {
            message.reply(`${target.tag} n'est pas dans la whitelist.`);
        }
    }
};
