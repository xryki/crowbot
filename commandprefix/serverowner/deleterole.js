const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'deleterole',
    description: 'Supprime un rôle sur le serveur',
    async execute(message, args, client) {
        const prefix = client.getPrefix(message.guild.id);
        
        // Vérifier si l'utilisateur est un owner
        if (!client.isOwner(message.author.id, message.guild.id)) {
            return message.reply('Commande réservée aux owners du bot.');
        }
        
        // Vérifier les permissions Discord (Administrateur requis)
        if (!message.member.permissions.has('Administrator')) {
            return message.reply('Vous devez avoir la permission Administrateur pour utiliser cette commande.');
        }
        
        // Vérifier les permissions du bot
        if (!message.guild.members.me.permissions.has('ManageRoles')) {
            return message.reply('Je n\'ai pas la permission de gérer les rôles.');
        }
        
        // Vérifier si un rôle est fourni
        if (!args[0]) {
            const errorEmbed = new EmbedBuilder()
                .setColor('FFFFFF')
                .setTitle('Erreur')
                .setDescription(`Usage: ${prefix}deleterole <nom ou mention ou ID du rôle>`)
                .addFields(
                    { name: 'Exemples:', value: `- ${prefix}deleterole @Membre\n- ${prefix}deleterole Membre\n- ${prefix}deleterole ` }
                )
                .setTimestamp();
            
            return message.reply({ embeds: [errorEmbed] });
        }
        
        let role;
        
        // Essayer de trouver le rôle par mention
        if (message.mentions.roles.first()) {
            role = message.mentions.roles.first();
        } 
        // Essayer de trouver par ID
        else if (args[0].match(/^\d+$/)) {
            role = message.guild.roles.cache.get(args[0]);
        } 
        // Essayer de trouver par nom
        else {
            const roleName = args.join(' ');
            role = message.guild.roles.cache.find(r => r.name.toLowerCase() === roleName.toLowerCase());
        }
        
        if (!role) {
            const notFoundEmbed = new EmbedBuilder()
                .setColor('FFFFFF')
                .setTitle('Rôle non trouvé')
                .setDescription('Le rôle spécifié n\'existe pas sur ce serveur.')
                .setTimestamp();
            
            return message.reply({ embeds: [notFoundEmbed] });
        }
        
        // Vérifier si le rôle peut être supprimé (pas le rôle everyone)
        if (role.position >= message.guild.members.me.roles.highest.position) {
            const permissionEmbed = new EmbedBuilder()
                .setColor('FFFFFF')
                .setTitle('Permission refusée')
                .setDescription('Je ne peux pas supprimer ce rôle car il est supérieur ou égal à mon rôle le plus élevé.')
                .setTimestamp();
            
            return message.reply({ embeds: [permissionEmbed] });
        }
        
        try {
            // Sauvegarder les informations du rôle avant suppression
            const roleInfo = {
                name: role.name,
                color: role.hexColor,
                position: role.position,
                mentionable: role.mentionable,
                hoist: role.hoist,
                permissions: role.permissions.bitfield.toString(),
                memberCount: role.members.size
            };
            
            // Supprimer le rôle
            await role.delete(`Supprimé par ${message.author.tag}`);
            
            const successEmbed = new EmbedBuilder()
                .setColor('FFFFFF')
                .setTitle('Rôle supprimé avec succès')
                .setDescription(`Le rôle ${roleInfo.name} a été supprimé.`)
                .addFields(
                    { name: 'ID du rôle', value: role.id },
                    { name: 'Couleur', value: roleInfo.color },
                    { name: 'Position', value: roleInfo.position.toString() },
                    { name: 'Membres affectés', value: roleInfo.memberCount.toString() },
                    { name: 'Supprimé par', value: message.author.tag }
                )
                .setTimestamp()
                .setFooter({ text: `Demandé par ${message.author.tag}`, iconURL: message.author.displayAvatarURL() });
            
            await message.reply({ embeds: [successEmbed] });
            
        } catch (error) {
            console.error('Erreur lors de la suppression du rôle:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('FFFFFF')
                .setTitle('Erreur lors de la suppression')
                .setDescription('Une erreur est survenue lors de la suppression du rôle.')
                .addFields(
                    { name: 'Erreur', value: error.message }
                )
                .setTimestamp();
            
            await message.reply({ embeds: [errorEmbed] });
        }
    }
};
