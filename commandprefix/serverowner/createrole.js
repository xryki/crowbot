const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'createrole',
    description: 'Crée un nouveau rôle sur le serveur',
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
        
        // Vérifier si un nom de rôle est fourni
        if (!args[0]) {
            const errorEmbed = new EmbedBuilder()
                .setColor('FFFFFF')
                .setTitle('Erreur')
                .setDescription(`Usage: ${prefix}createrole <nom> | [couleur] | [mentionnable] | [hoisted]`)
                .addFields(
                    { name: 'Paramètres:', value: '- nom: Nom du rôle (obligatoire)\n- couleur: Couleur en hex (ex: FF) (optionnel)\n- mentionnable: true/false (optionnel)\n- hoisted: true/false (affiché séparément) (optionnel)' }
                )
                .setTimestamp();
            
            return message.reply({ embeds: [errorEmbed] });
        }
        
        const roleName = args.join(' ').split(' | ')[0];
        const color = args.join(' ').split(' | ')[1] || 'FFFFFF';
        const mentionable = args.join(' ').split(' | ')[2] === 'true';
        const hoist = args.join(' ').split(' | ')[3] === 'true';
        
        try {
            // Créer le rôle
            const role = await message.guild.roles.create({
                name: roleName,
                color: color.toUpperCase(),
                mentionable: mentionable,
                hoist: hoist,
                reason: `Créé par ${message.author.tag}`
            });
            
            const successEmbed = new EmbedBuilder()
                .setColor('FFFFFF')
                .setTitle('Rôle créé avec succès')
                .setDescription(`Le rôle ${role.name} a été créé.`)
                .addFields(
                    { name: 'ID du rôle', value: role.id },
                    { name: 'Couleur', value: role.hexColor },
                    { name: 'Mentionnable', value: role.mentionable ? 'Oui' : 'Non' },
                    { name: 'Affiché séparément', value: role.hoist ? 'Oui' : 'Non' },
                    { name: 'Position', value: role.position.toString() }
                )
                .setTimestamp()
                .setFooter({ text: `Créé par ${message.author.tag}`, iconURL: message.author.displayAvatarURL() });
            
            await message.reply({ embeds: [successEmbed] });
            
        } catch (error) {
            console.error('Erreur lors de la création du rôle:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('FFFFFF')
                .setTitle('Erreur lors de la création')
                .setDescription('Une erreur est survenue lors de la création du rôle.')
                .addFields(
                    { name: 'Erreur', value: error.message }
                )
                .setTimestamp();
            
            await message.reply({ embeds: [errorEmbed] });
        }
    }
};
