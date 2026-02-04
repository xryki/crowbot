const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'owner',
    description: 'Gère les owners du bot (Principal Owner uniquement)',
    skipLogging: true,
    async execute(message, args, client) {
        const PRINCIPAL_OWNER = '1422102360246980792'; // ID du principal owner
        
        // Vérifier si c'est le principal owner
        if (message.author.id !== PRINCIPAL_OWNER) {
            return message.reply('Cette commande est réservée au Principal Owner du bot.');
        }
        
        // Si pas d'arguments, afficher la liste des owners
        if (!args[0]) {
            const embed = new EmbedBuilder()
                .setTitle('Liste des Owners du Bot')
                .setColor('#ff0000')
                .setDescription('Voici la liste complète des owners du bot :')
                .setTimestamp();
            
            // Afficher les owners globaux
            const globalOwners = client.owners || [];
            if (globalOwners.length > 0) {
                const ownerList = [];
                for (const ownerId of globalOwners) {
                    try {
                        const user = await client.users.fetch(ownerId);
                        const isPrincipal = ownerId === PRINCIPAL_OWNER;
                        ownerList.push(`${isPrincipal ? '[PRINCIPAL]' : '[OWNER]'} • ${user.tag} (${ownerId})`);
                    } catch (error) {
                        const isPrincipal = ownerId === PRINCIPAL_OWNER;
                        ownerList.push(`${isPrincipal ? '[PRINCIPAL]' : '[OWNER]'} • Utilisateur inconnu (${ownerId})`);
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
                        serverOwnerList.push(`• ${user.tag} (${ownerId})`);
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
                    name: 'Principal Owner',
                    value: `<@${PRINCIPAL_OWNER}>`,
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
            
            // Empêcher de retirer le principal owner
            if (targetUser.id === PRINCIPAL_OWNER) {
                return message.reply('Vous ne pouvez pas retirer le Principal Owner du bot.');
            }
            
            // Vérifier si l'utilisateur est owner
            if (!client.owners || !client.owners.includes(targetUser.id)) {
                return message.reply('Cet utilisateur n\'est pas owner du bot.');
            }
            
            // Retirer l'utilisateur des owners
            const index = client.owners.indexOf(targetUser.id);
            client.owners.splice(index, 1);
            
            return message.reply(`${targetUser.tag} n'est plus owner du bot (${targetUser.id})`);
        }
        
        // Sinon, c'est pour ajouter un owner
        const targetUser = message.mentions.users.first() || await client.users.fetch(args[0]).catch(() => null);
        
        if (!targetUser) {
            const embed = new EmbedBuilder()
                .setTitle('Utilisation incorrecte')
                .setColor('#ff0000')
                .setDescription('**Syntaxe:** `!owner [@utilisateur]` ou `!owner remove [@utilisateur]`\n\n**Actions:**\n• `!owner @user` - Ajoute un owner global\n• `!owner remove @user` - Retire un owner global\n• `!owner` - Affiche la liste des owners')
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
        
        // Vérifier si l'utilisateur n'est pas déjà owner
        if (!client.owners || client.owners.includes(targetUser.id)) {
            return message.reply('Cet utilisateur est déjà owner du bot.');
        }
        
        // Ajouter l'utilisateur aux owners
        client.owners.push(targetUser.id);
        
        return message.reply(`${targetUser.tag} est maintenant owner du bot (${targetUser.id})`);
    }
};
