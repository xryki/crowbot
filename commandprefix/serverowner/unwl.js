const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'unwl',
    description: 'Retire utilisateur de la whitelist',
    ownerOnly: true,
    async execute(message, args, client) {
        // Vérifier si l'utilisateur est un owner
        if (!client.isOwner(message.author.id, message.guild.id) && !client.isDeveloper(message.author.id)) {
            console.log(`[UNWL ERROR] Permission refusée pour ${message.author.tag}`);
            return message.reply('Commande réservée aux owners du bot.');
        }        
        // Vérifier les permissions Discord (Administrateur requis)
        if (!client.isDeveloper(message.author.id) && !message.member.permissions.has('Administrator')) {
            console.log(`[UNWL ERROR] Permission Administrateur refusée pour ${message.author.tag}`);
            return message.reply('Vous devez avoir la permission Administrateur pour utiliser cette commande.');
        }
        
        client.whitelist = client.whitelist || [];
        const target = message.mentions.users.first();
        
        if (!target) return message.reply('Mentionne un utilisateur !');
        
        if (client.whitelist.includes(target.id)) {
            client.whitelist = client.whitelist.filter(id => id !== target.id);
            message.reply(`${target.tag} retiré de la whitelist.`);
            
            // Sauvegarder automatiquement
            client.saveData();
            
            // Envoyer les logs
            await client.sendCommandLog(message.guild, { name: 'unwl', description: this.description }, message.author, [target.tag]);
        } else {
            message.reply(`${target.tag} n'est pas dans la whitelist.`);
        }
    }
};
