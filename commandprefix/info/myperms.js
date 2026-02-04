const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'myperm',
    description: 'Affiche votre niveau de permission et les commandes disponibles',
    skipLogging: true, // Ne pas logger la commande myperm
    async execute(message, args, client) {
        const userPermLevel = client.permissionSystem.getUserPermissionLevel(message.guild.id, message.author.id);
        const availableCommands = client.permissionSystem.getCommandsForLevel(userPermLevel);
        
        const embed = new EmbedBuilder()
            .setTitle('Vos Permissions')
            .setColor(userPermLevel > 0 ? '#00ff00' : '#ff0000')
            .setDescription(`Informations sur vos permissions pour **${message.guild.name}**:`)
            .setThumbnail(message.author.displayAvatarURL())
            .setTimestamp();
        
        if (userPermLevel === 0) {
            embed.addFields(
                {
                    name: 'Niveau de permission',
                    value: 'Aucune permission spéciale',
                    inline: true
                },
                {
                    name: 'Accès',
                    value: 'Vous n\'avez accès à aucune commande personnalisée.\nContactez un administrateur pour obtenir des permissions.',
                    inline: false
                }
            );
            embed.setColor('#ff0000');
        } else {
            // Déterminer le nom du niveau
            const levelNames = {
                1: 'Utilisateur basique',
                2: 'help', 
                3: 'staff',
                4: 'Modérateur ',
                5: 'Admin',
                6: 'admin staff',
                7: 'co owner',
                8: 'owner bot server',
                9: 'Principal Owner'
            };
            
            embed.addFields(
                {
                    name: 'Niveau de permission',
                    value: `Perm ${userPermLevel} - ${levelNames[userPermLevel]}`,
                    inline: true
                },
                {
                    name: 'Commandes disponibles',
                    value: `${availableCommands.length} commandes au total`,
                    inline: true
                },
                {
                    name: 'Catégories accessibles',
                    value: this.getAccessibleCategories(userPermLevel),
                    inline: false
                }
            );
            
            // Afficher quelques exemples de commandes
            if (availableCommands.length > 0) {
                const examples = availableCommands.slice(0, 8);
                embed.addFields({
                    name: 'Exemples de commandes',
                    value: `\`${client.getPrefix(message.guild.id)}${examples.join(`\`, \`${client.getPrefix(message.guild.id)}`)}\`${availableCommands.length > 8 ? '...' : ''}`,
                    inline: false
                });
            }
            
            embed.setColor('#00ff00');
        }
        
        // Ajouter des informations supplémentaires
        embed.addFields(
            {
                name: 'Vérification',
                value: `Utilisez \`${client.getPrefix(message.guild.id)}help\` pour voir toutes vos commandes disponibles.`,
                inline: false
            }
        );
        
        return message.reply({ embeds: [embed] });
    },
    
    getAccessibleCategories(level) {
        const categories = [];
        
        if (level >= 1) categories.push('Fun', 'Informations');
        if (level >= 2) categories.push('Utilitaires');
        if (level >= 3) categories.push('Modération (débutant)');
        if (level >= 4) categories.push('Modération (avancé)');
        if (level >= 5) categories.push('Administration');
        if (level >= 6) categories.push('Owner');
        if (level >= 7) categories.push('Super Owner');
        if (level >= 8) categories.push('Co-Owner');
        if (level >= 9) categories.push('Principal Owner');
        
        return categories.join(' • ') || 'Aucune';
    }
};
