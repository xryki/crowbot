const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'owner',
    description: 'Gère les owners du bot (Développeur uniquement)',
    skipLogging: true,
    async execute(message, args, client) {
        // Vérifier si c'est le développeur
        if (!client.isDeveloper(message.author.id)) {
            return message.reply('Cette commande est réservée au Développeur du bot.');
        }
        
        // Si pas d'arguments, afficher la liste des owners
        if (!args[0]) {
            const embed = new EmbedBuilder()
                .setTitle('Liste des Owners du Bot')
                .setColor('FFFFFF')
                .setDescription('Voici la liste complète des owners du bot :')
                .setTimestamp();
            
            // Afficher les owners globaux
            const globalOwners = client.owners || [];
            if (globalOwners.length > 0) {
                const ownerList = [];
                for (const ownerId of globalOwners) {
                    try {
                        const user = await client.users.fetch(ownerId);
                        const isDeveloper = client.isDeveloper(ownerId);
                        ownerList.push(`${isDeveloper ? '[DÉVELOPPEUR]' : '[OWNER]'} • <@${user.id}> (**${user.tag}**)`);
                    } catch (error) {
                        const isDeveloper = client.isDeveloper(ownerId);
                        ownerList.push(`${isDeveloper ? '[DÉVELOPPEUR]' : '[OWNER]'} • Utilisateur inconnu (${ownerId})`);
                    }
                }
                
                embed.addFields({
                    name: 'Owner',
                    value: ownerList.join('\n'),
                    inline: false
                });
            }
            
            // Afficher les owners de serveur si disponibles
            const serverOwners = client.serverOwners?.get(message.guild.id);
            if (serverOwners && serverOwners.length > 0) {
                const serverOwnerList = [];
                for (const ownerId of serverOwners) {
                    try {
                        const user = await client.users.fetch(ownerId);
                        serverOwnerList.push(`• <@${user.id}> (**${user.tag}**)`);
                    } catch (error) {
                        serverOwnerList.push(`• Utilisateur inconnu (${ownerId})`);
                    }
                }
                
                embed.addFields({
                    name: 'Owner bot du Serveur',
                    value: serverOwnerList.join('\n'),
                    inline: false
                });
            }
            
            // Ajouter des informations
            embed.addFields(
                {
                    name: 'Développeur',
                    value: `<@!${client.ownerId}>`,
                    inline: true
                },
                {
                    name: 'Total',
                    value: `${globalOwners.length} owners globaux${serverOwners ? ` + ${serverOwners.length} owners serveur` : ''}`,
                    inline: true
                }
            );
            
            return message.reply({ embeds: [embed] });
        }
        
        // Si premier argument est "remove"
        if (args[0].toLowerCase() === 'remove') {
            const targetUser = message.mentions.users.first() || await client.users.fetch(args[1]).catch(() => null);
            
            if (!targetUser) {
                return message.reply('Utilisateur introuvable. Mentionnez un utilisateur ou donnez son ID.');
            }
            
            // Empêcher de retirer le développeur
            if (targetUser.id === '') {
                return message.reply('Vous ne pouvez pas retirer le Développeur du bot.');
            }
            
            // Vérifier si l'utilisateur est owner
            if (!client.owners || !client.owners.includes(targetUser.id)) {
                return message.reply('Cet utilisateur n\'est pas owner du bot.');
            }
            
            // Retirer l'utilisateur des owners
            const index = client.owners.indexOf(targetUser.id);
            client.owners.splice(index, 1);
            
            // Sauvegarder automatiquement
            client.saveData();
            
            return message.reply(`<@${targetUser.id}> n'est plus owner du bot (**${targetUser.tag}**)`);
        }
        
        // Sinon, c'est pour ajouter un owner
        const targetUser = message.mentions.users.first() || await client.users.fetch(args[0]).catch(() => null);
        
        if (!targetUser) {
            return message.reply('Veuillez mentionner un utilisateur valide.');
        }
        
        // Vérifier si l'utilisateur n'est pas déjà owner
        if (!client.owners || client.owners.includes(targetUser.id)) {
            return message.reply('Cet utilisateur est déjà owner du bot.');
        }
        
        // Ajouter l'utilisateur aux owners
        client.owners.push(targetUser.id);
        
        // Sauvegarder automatiquement
        client.saveData();
        
        return message.reply(`<@${targetUser.id}> est maintenant owner du bot (**${targetUser.tag}**)`);
    }
};
