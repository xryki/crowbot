const { PermissionsBitField, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'delperm',
    description: 'Retire la permission d\'un rôle',
    async execute(message, args, client) {
        // Vérifier si c'est un owner du bot
        if (!client.isOwner(message.author.id, message.guild.id)) {
            return message.reply('Cette commande est réservée aux owners du bot.');
        }
        
        if (!args[0]) {
            const embed = new EmbedBuilder()
                .setTitle('Utilisation incorrecte')
                .setColor('#ff0000')
                .setDescription('**Syntaxe:** `!delperm <@role>`\n\nRetire toutes les permissions personnalisées du rôle spécifié.')
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
        
        // Récupérer le rôle (mention ou ID)
        let role;
        if (message.mentions.roles.first()) {
            role = message.mentions.roles.first();
        } else if (args[0].match(/^\d+$/)) {
            role = message.guild.roles.cache.get(args[0]);
        }
        
        if (!role) {
            return message.reply('Rôle introuvable. Mentionnez un rôle ou donnez son ID.');
        }
        
        // Retirer la permission
        const success = client.permissionSystem.removeRolePermission(message.guild.id, role.id);
        
        if (success) {
            const embed = new EmbedBuilder()
                .setTitle('Permission retirée')
                .setColor('#ff9900')
                .addFields(
                    { name: 'Rôle', value: `${role.name} (${role.id})`, inline: true },
                    { name: 'Action', value: 'Permissions personnalisées supprimées', inline: true }
                )
                .setDescription(`Le rôle ${role} n'a plus de permissions personnalisées. Il ne pourra utiliser que les commandes basées sur les permissions Discord par défaut.`)
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        } else {
            return message.reply('Ce rôle n\'avait pas de permissions personnalisées.');
        }
    }
};
