const { PermissionsBitField, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'perms',
    description: 'Affiche la configuration des permissions du serveur',
    async execute(message, args, client) {
        // Vérifier si c'est un owner du bot
        if (!client.isOwner(message.author.id, message.guild.id)) {
            return message.reply('Cette commande est réservée aux owners du bot.');
        }
        
        const guildPerms = client.permissionSystem.getGuildPermissions(message.guild.id);
        
        const embed = new EmbedBuilder()
            .setTitle('Configuration des Permissions')
            .setColor('#0099ff')
            .setDescription(`Configuration des permissions pour **${message.guild.name}**:`)
            .setTimestamp();
        
        // Afficher tous les niveaux de permission (1-9) avec les rôles assignés
        for (let level = 1; level <= 9; level++) {
            const roleIds = Object.keys(guildPerms).filter(roleId => guildPerms[roleId] === level);
            
            const roleNames = roleIds.map(roleId => {
                const role = message.guild.roles.cache.get(roleId);
                return role ? role.name : 'Rôle supprimé';
            }).join(', ') || 'Aucun rôle';
            
            // Vérifier si ce niveau a des commandes personnalisées pour ce serveur
            const hasCustomCommands = client.serverPermLevels && 
                                    client.serverPermLevels.has(message.guild.id) && 
                                    client.serverPermLevels.get(message.guild.id)[level];
            
            embed.addFields({
                name: `Perm ${level}`,
                value: `**Rôles:** ${roleNames}`,
                inline: false
            });
        }
        
        // Ajouter des informations supplémentaires
        embed.addFields(
            {
                name: 'Statistiques',
                value: `**Total de rôles configurés:** ${Object.keys(guildPerms).length}\n**Niveaux utilisés:** ${Object.keys(guildPerms).length > 0 ? Object.keys(guildPerms).sort((a, b) => a - b).join(', ') : 'Aucun'}`,
                inline: false
            },
            {
                name: 'Commandes disponibles',
                value: `\`${client.getPrefix(message.guild.id)}setperm <@role> <niveau>\` - Assigner une permission\n\`${client.getPrefix(message.guild.id)}delperm <@role>\` - Retirer une permission\n\`${client.getPrefix(message.guild.id)}editperm <niveau> <action>\` - Modifier les commandes\n\`${client.getPrefix(message.guild.id)}myperm\` - Voir vos permissions`,
                inline: false
            },
            {
                name: 'Sauvegarde automatique',
                value: 'Les permissions sont automatiquement sauvegardées par serveur et persistantes même après redémarrage.',
                inline: false
            }
        );
        
        return message.reply({ embeds: [embed] });
    }
};
