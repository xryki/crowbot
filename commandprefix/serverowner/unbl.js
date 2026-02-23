const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'unbl',
    description: 'Retire utilisateur de la blacklist',
    ownerOnly: true,
    async execute(message, args, client) {
        // Vérifier si l'utilisateur est un owner
        if (!client.isOwner(message.author.id, message.guild.id) && !client.isDeveloper(message.author.id)) {
            console.log(`[UNBL ERROR] Permission refusée pour ${message.author.tag}`);
            return message.reply('Commande réservée aux owners du bot.');
        }        
        // Vérifier les permissions Discord (Administrateur requis)
        if (!client.isDeveloper(message.author.id) && !message.member.permissions.has('Administrator')) {
            console.log(`[UNBL ERROR] Permission Administrateur refusée pour ${message.author.tag}`);
            return message.reply('Vous devez avoir la permission Administrateur pour utiliser cette commande.');
        }
        
        client.blacklist = client.blacklist || [];
        const target = message.mentions.users.first();
        
        if (!target) return message.reply('Mentionne un utilisateur !');
        
        if (client.blacklist.includes(target.id)) {
            client.blacklist = client.blacklist.filter(id => id !== target.id);
            message.reply(`${target.tag} retiré de la blacklist.`);
            
            // Sauvegarder automatiquement
            client.saveData();
            
            // Envoyer les logs
            await client.sendCommandLog(message.guild, { name: 'unbl', description: this.description }, message.author, [target.tag]);
        } else {
            message.reply(`${target.tag} n'est pas dans la blacklist.`);
        }
    }
};
