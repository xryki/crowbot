const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'autorole',
    description: 'Configure rôle auto pour nouveaux membres',
    permissions: PermissionsBitField.Flags.Administrator,
    async execute(message, args, client) {
        // Vérifier si l'utilisateur est owner (global ou serveur)
        if (!client.isOwner(message.author.id, message.guild.id)) {
            return message.reply('Commande réservée aux owners du bot.');
        }
        
        // Si pas d'arguments, afficher le rôle configuré
        if (!args[0]) {
            const currentRole = client.autorole?.[message.guild.id];
            if (!currentRole) {
                return message.reply('Aucun rôle configuré pour ce serveur.');
            }
            
            const role = message.guild.roles.cache.get(currentRole);
            if (!role) {
                return message.reply('Le rôle configuré n\'existe plus.');
            }
            
            return message.reply(`Rôle  actuel: ${role.name}`);
        }
        
        const role = message.mentions.roles.first();
        if (!role) return message.reply('Mentionne un rôle !');
        
        client.autorole = client.autorole || {};
        client.autorole[message.guild.id] = role.id;
        
        // Sauvegarder automatiquement
        client.saveData();
        
        message.reply(`Rôle auto configuré: ${role.name}`);
    }
};
