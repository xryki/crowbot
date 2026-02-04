const { PermissionsBitField, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'setperm',
    description: 'Assigne un niveau de permission à un rôle',
    async execute(message, args, client) {
        // Vérifier si c'est un owner du bot
        if (!client.isOwner(message.author.id, message.guild.id)) {
            return message.reply('Cette commande est réservée aux owners du bot.');
        }
        
        if (!args[0] || !args[1]) {
            const embed = new EmbedBuilder()
                .setTitle('Utilisation incorrecte')
                .setColor('#ff0000')
                .setDescription(`**Syntaxe:** \`${client.getPrefix(message.guild.id)}setperm <@role> <niveau>\`\n**Niveaux disponibles:** 1-9\n\n**Description des niveaux:**\n• **Perm 1:** Utilisateurs basiques (help, ping, fun...)\n• **Perm 2:** Utilisateurs avancés (prefix, create...)\n• **Perm 3:** Modérateurs débutants (clear, mute...)\n• **Perm 4:** Modérateurs avancés (kick, ban...)\n• **Perm 5:** Administrateurs (setup, logs...)\n• **Perm 6:** Owners du bot (eval, restart...)\n• **Perm 7:** Super Owners (commandes avancées)\n• **Perm 8:** Co-Owners (co-gestion)\n• **Perm 9:** Principal Owner (gestion complète)`)
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
        
        // Vérifier le niveau de permission
        const permLevel = parseInt(args[1]);
        if (isNaN(permLevel) || permLevel < 1 || permLevel > 9) {
            return message.reply('Le niveau de permission doit être un nombre entre 1 et 9.');
        }
        
        // Assigner la permission
        const success = client.permissionSystem.assignRoleToPermission(message.guild.id, role.id, permLevel);
        
        if (success) {
            const embed = new EmbedBuilder()
                .setTitle('Permission assignée')
                .setColor('#00ff00')
                .addFields(
                    { name: 'Rôle', value: `${role.name} (${role.id})`, inline: true },
                    { name: 'Niveau de permission', value: `Perm ${permLevel}`, inline: true },
                    { name: 'Commandes disponibles', value: client.permissionSystem.getCommandsForLevel(permLevel).length + ' commandes', inline: true }
                )
                .setDescription(`Le rôle ${role} a maintenant accès à toutes les commandes de niveau ${permLevel} et inférieurs.`)
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        } else {
            return message.reply('Une erreur est survenue lors de l\'assignation de la permission.');
        }
    }
};
