const { PermissionsBitField, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'serverowners',
    description: 'Gère les owners du bot par serveur (Développeur uniquement)',
    skipLogging: true,
    async execute(message, args, client) {
        // Vérifier si c'est le développeur
        if (!client.isDeveloper(message.author.id)) {
            return message.reply('Cette commande est réservée au Développeur du bot.');
        }
        const guild = message.guild;
        
        // Initialiser les données d'owners par serveur si elles n'existent pas
        if (!client.serverOwners) {
            client.serverOwners = new Map();
        }
        
        const subcommand = args[0]?.toLowerCase();
        
        if (!subcommand) {
            // Afficher la liste des owners du serveur
            const serverOwners = client.serverOwners.get(guild.id) || [];
            
            if (serverOwners.length === 0) {
                const embed = new EmbedBuilder()
                    .setTitle('Owners du Serveur')
                    .setDescription(`Aucun owner serveur configuré.\nUtilisez \`${client.getPrefix(guild.id)}serverowners add @utilisateur\` pour en ajouter.`)
                    .setColor('FFFFFF')
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }
            
            const embed = new EmbedBuilder()
                .setTitle('Owners du Serveur')
                .setColor('FFFFFF')
                .setThumbnail(guild.iconURL({ dynamic: true, size: 512 }))
                .setFooter({ text: `Serveur: ${guild.name}` })
                .setTimestamp();
            
            let ownerList = '';
            for (let i = 0; i < serverOwners.length; i++) {
                const ownerId = serverOwners[i];
                const member = guild.members.cache.get(ownerId);
                
                if (member) {
                    ownerList += `${i + 1}. ${member.user.tag}\n> ID: \`${ownerId}\`\n\n`;
                } else {
                    ownerList += `${i + 1}. Utilisateur inconnu\n> ID: \`${ownerId}\`\n\n`;
                }
            }
            
            embed.setDescription(`${serverOwners.length} owner(s) configuré(s) :\n\n${ownerList}`);
            
            return message.reply({ embeds: [embed] });
        }
        
        switch (subcommand) {
            case 'add':
                const userToAdd = message.mentions.users.first();
                if (!userToAdd) {
                    return message.reply('Mentionne un utilisateur à ajouter comme owner du serveur !');
                }
                
                if (userToAdd.bot) {
                    return message.reply('Vous ne pouvez pas ajouter un bot comme owner du serveur.');
                }
                
                const currentOwners = client.serverOwners.get(guild.id) || [];
                if (currentOwners.includes(userToAdd.id)) {
                    return message.reply('Cet utilisateur est déjà owner du serveur.');
                }
                
                currentOwners.push(userToAdd.id);
                client.serverOwners.set(guild.id, currentOwners);
                
                // Mettre à jour la whitelist anti-raid
                client.updateAntiRaidWhitelist();
                
                // Sauvegarder automatiquement
                client.saveData();
                
                await message.reply(`${userToAdd} est maintenant owner du serveur !`);
                break;
                
            case 'remove':
                const userToRemove = message.mentions.users.first();
                if (!userToRemove) {
                    return message.reply('Mentionne un utilisateur à retirer des owners du serveur !');
                }
                
                const ownersList = client.serverOwners.get(guild.id) || [];
                const index = ownersList.indexOf(userToRemove.id);
                
                if (index === -1) {
                    return message.reply('Cet utilisateur n\'est pas owner du serveur.');
                }
                
                ownersList.splice(index, 1);
                client.serverOwners.set(guild.id, ownersList);
                
                // Mettre à jour la whitelist anti-raid
                client.updateAntiRaidWhitelist();
                
                // Sauvegarder automatiquement
                client.saveData();
                
                await message.reply(`${userToRemove} n'est plus owner du serveur.`);
                break;
                
            case 'clear':
                if (!client.isDeveloper(message.author.id)) {
                    return message.reply('Seul le Développeur du bot peut utiliser cette commande.');
                }
                
                client.serverOwners.delete(guild.id);
                
                // Mettre à jour la whitelist anti-raid
                client.updateAntiRaidWhitelist();
                
                // Sauvegarder automatiquement
                client.saveData();
                
                await message.reply('Tous les owners du serveur ont été retirés.');
                break;
                
            case 'check':
                const member = message.mentions.members.first() || message.member;
                const serverOwnerList = client.serverOwners.get(guild.id) || [];
                const isServerOwner = serverOwnerList.includes(member.id);
                const isGlobalOwner = client.owners.includes(member.id);
                
                const checkEmbed = new EmbedBuilder()
                    .setTitle(`Permissions de ${member.user.tag}`)
                    .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 512 }))
                    .setColor(client.isDeveloper(member.id) ? xFF : isGlobalOwner ? xFFA : isServerOwner ? xFF : x)
                    .addFields(
                        { 
                            name: 'Développeur', 
                            value: client.isDeveloper(member.id) ? 'Oui' : 'Non', 
                            inline: true 
                        },
                        { 
                            name: 'Owner Global', 
                            value: isGlobalOwner ? 'Oui' : 'Non', 
                            inline: true 
                        },
                        { 
                            name: 'Owner du Serveur', 
                            value: isServerOwner ? 'Oui' : 'Non', 
                            inline: true 
                        },
                        { 
                            name: 'Niveau d\'accès', 
                            value: client.isDeveloper(member.id) ? 'Contrôle total' : isGlobalOwner ? 'Owner Global' : isServerOwner ? 'Administration serveur' : 'Utilisateur normal', 
                            inline: false 
                        }
                    )
                    .setFooter({ text: `ID: ${member.id}` })
                    .setTimestamp();
                
                await message.reply({ embeds: [checkEmbed] });
                break;
                
            default:
                await message.reply(`Usage: \`${client.getPrefix(message.guild.id)}serverowners [add|remove|clear|check]\``);
        }
    }
};
