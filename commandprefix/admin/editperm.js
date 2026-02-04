const { PermissionsBitField, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'editperm',
    description: 'Modifie les commandes accessibles à un niveau de permission (par serveur)',
    permissions: PermissionsBitField.Flags.Administrator,
    async execute(message, args, client) {
        // Vérifier si c'est un owner du bot
        if (!client.isOwner(message.author.id, message.guild.id)) {
            return message.reply('Cette commande est réservée aux owners du bot.');
        }
        
        if (args.length < 3) {
            const embed = new EmbedBuilder()
                .setTitle('Utilisation incorrecte')
                .setColor('#ff0000')
                .setDescription(`**Syntaxe:** \`${client.getPrefix(message.guild.id)}editperm <niveau> <action> <commandes>\`\n\n**Actions:**\n• \`add\` - Ajoute des commandes\n• \`remove\` - Retire des commandes\n• \`list\` - Affiche les commandes du niveau\n• \`reset\` - Réinitialise aux commandes globales\n\n**Exemples:**\n• \`${client.getPrefix(message.guild.id)}editperm 3 add clear kick warn\`\n• \`${client.getPrefix(message.guild.id)}editperm 4 remove ban derank\`\n• \`${client.getPrefix(message.guild.id)}editperm 5 add setup logs welcome\``)
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
        
        const permLevel = parseInt(args[0]);
        const action = args[1].toLowerCase();
        const commands = args.slice(2).map(cmd => cmd.trim().toLowerCase());
        
        if (isNaN(permLevel) || permLevel < 1 || permLevel > 9) {
            return message.reply('Le niveau de permission doit être un nombre entre 1 et 9.');
        }
        
        const guildId = message.guild.id;
        
        // Initialiser les permissions personnalisées du serveur si elles n'existent pas
        if (!client.serverPermLevels) {
            client.serverPermLevels = new Map();
        }
        
        if (!client.serverPermLevels.has(guildId)) {
            client.serverPermLevels.set(guildId, {});
        }
        
        const serverPerms = client.serverPermLevels.get(guildId);
        
        // Récupérer les commandes actuelles (serveur puis globales)
        const globalCommands = client.permissionSystem.client.permLevels.get(permLevel) || [];
        const currentCommands = serverPerms[permLevel] || [...globalCommands];
        
        switch (action) {
            case 'list':
                const embed = new EmbedBuilder()
                    .setTitle(`Commandes - Perm ${permLevel} (${message.guild.name})`)
                    .setColor('#0099ff')
                    .setDescription(`Commandes actuelles (${currentCommands.length}):\n${currentCommands.length > 0 ? currentCommands.join(', ') : 'Aucune commande'}`)
                    .addFields(
                        { name: 'Source', value: serverPerms[permLevel] ? 'Personnalisées pour ce serveur' : 'Configuration globale', inline: true }
                    )
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
                
            case 'add':
                const newCommandsAdd = [...new Set([...currentCommands, ...commands])];
                
                serverPerms[permLevel] = newCommandsAdd;
                client.serverPermLevels.set(guildId, serverPerms);
                
                // Sauvegarder
                if (client.dataSaver) {
                    const serverPermsData = {};
                    for (const [sid, perms] of client.serverPermLevels) {
                        serverPermsData[sid] = perms;
                    }
                    client.dataSaver.saveData('serverPermLevels', serverPermsData);
                }
                
                const addEmbed = new EmbedBuilder()
                    .setTitle('Commandes ajoutées')
                    .setColor('#00ff00')
                    .setDescription(`Perm ${permLevel}: ${commands.length} commande(s) ajoutées`)
                    .addFields(
                        { name: 'Commandes', value: commands.join(', '), inline: true },
                        { name: 'Total', value: `${newCommandsAdd.length} commandes`, inline: true },
                        { name: 'Serveur', value: message.guild.name, inline: true }
                    )
                    .setTimestamp();
                
                return message.reply({ embeds: [addEmbed] });
                
            case 'remove':
                const remainingCommands = currentCommands.filter(cmd => !commands.includes(cmd));
                
                serverPerms[permLevel] = remainingCommands;
                client.serverPermLevels.set(guildId, serverPerms);
                
                // Sauvegarder
                if (client.dataSaver) {
                    const serverPermsData = {};
                    for (const [sid, perms] of client.serverPermLevels) {
                        serverPermsData[sid] = perms;
                    }
                    client.dataSaver.saveData('serverPermLevels', serverPermsData);
                }
                
                const removeEmbed = new EmbedBuilder()
                    .setTitle('Commandes retirées')
                    .setColor('#ff9900')
                    .setDescription(`Perm ${permLevel}: ${commands.length} commande(s) retirées`)
                    .addFields(
                        { name: 'Commandes', value: commands.join(', '), inline: true },
                        { name: 'Total', value: `${remainingCommands.length} commandes`, inline: true },
                        { name: 'Serveur', value: message.guild.name, inline: true }
                    )
                    .setTimestamp();
                
                return message.reply({ embeds: [removeEmbed] });
                
            case 'reset':
                delete serverPerms[permLevel];
                client.serverPermLevels.set(guildId, serverPerms);
                
                // Sauvegarder
                if (client.dataSaver) {
                    const serverPermsData = {};
                    for (const [sid, perms] of client.serverPermLevels) {
                        serverPermsData[sid] = perms;
                    }
                    client.dataSaver.saveData('serverPermLevels', serverPermsData);
                }
                
                const resetEmbed = new EmbedBuilder()
                    .setTitle('Permissions réinitialisées')
                    .setColor('#ffff00')
                    .setDescription(`Perm ${permLevel}: Retour à la configuration globale`)
                    .addFields(
                        { name: 'Commandes globales', value: globalCommands.join(', ') || 'Aucune', inline: true },
                        { name: 'Serveur', value: message.guild.name, inline: true }
                    )
                    .setTimestamp();
                
                return message.reply({ embeds: [resetEmbed] });
                
            default:
                return message.reply('Action invalide. Utilise `add`, `remove`, `list` ou `reset`.');
        }
    }
};
