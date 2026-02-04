const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'wl',
    description: 'Ajoute/retire utilisateur de la whitelist',
    ownerOnly: true,
    async execute(message, args, client) {
        client.whitelist = client.whitelist || [];
        
        let target;
        let targetId;
        
        // Vérifier si c'est une mention ou un ID
        if (message.mentions.users.first()) {
            target = message.mentions.users.first();
            targetId = target.id;
        } else if (args[0] && /^\d+$/.test(args[0])) {
            // C'est un ID numérique
            targetId = args[0];
            try {
                target = await client.users.fetch(targetId);
            } catch (error) {
                target = null;
            }
        } else {
            return message.reply('Mentionne un utilisateur ou donne un ID valide !');
        }
        
        if (client.whitelist.includes(targetId)) {
            client.whitelist = client.whitelist.filter(id => id !== targetId);
            const targetName = target ? target.tag : `Utilisateur ${targetId}`;
            message.reply(`${targetName} retiré de la whitelist.`);
        } else {
            client.whitelist.push(targetId);
            const targetName = target ? target.tag : `Utilisateur ${targetId}`;
            message.reply(`${targetName} ajouté à la whitelist.`);
        }
        
        // Envoyer les logs
        await client.sendCommandLog(message.guild, { name: 'wl', description: this.description }, message.author, [targetName || targetId]);
    }
};
