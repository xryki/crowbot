const { PermissionsBitField, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    name: 'help',
    description: 'Affiche toutes les commandes du bot',
    skipLogging: true, // Ne pas logger la commande help
    async execute(message, args, client) {
        try {
            const prefix = client.getPrefix(message.guild.id);
            
            // Titre et description uniformes
            const embedTitle = "Liste des commandes par permissions";
            const embedDescription = "Les paramètres peuvent être des noms, des mentions, ou des IDs\nSi ce ne sont pas des mentions ils doivent être séparés par ,,";
            
            // Regrouper toutes les commandes par catégorie fonctionnelle
            const categories = {
                admin: { name: 'Administration', commands: [] },
                fun: { name: 'Fun', commands: [] },
                giveaway: { name: 'Giveaway', commands: [] },
                info: { name: 'Informations', commands: [] },
                mod: { name: 'Moderation', commands: [] },
                owner: { name: 'Owner', commands: [] },
                util: { name: 'Utilitaires', commands: [] }
            };
        
        
        client.prefixCommands.forEach(cmd => {
            // Ignorer les handlers et les commandes owner privées
            if (cmd.name && (cmd.name.toLowerCase().includes('handler') || ['owners', 'ownerlist', 'setowner', 'serverowners'].includes(cmd.name))) {
                return;
            }
            
            // Ignorer les commandes sans nom
            if (!cmd.name) {
                return;
            }
            
            // Déterminer la catégorie en fonction du nom de la commande
            if (['autorole', 'setup', 'bl', 'unbl', 'bls', 'wl', 'unwl', 'logs', 'antiraid', 'welcome', 'ticket', 'massrole', 'setperm', 'delperm', 'perms', 'editperm', 'resetserverperms'].includes(cmd.name)) {
                categories.admin.commands.push(cmd);
            } else if (['8ball', 'coinflip'].includes(cmd.name)) {
                categories.fun.commands.push(cmd);
            } else if (['gw'].includes(cmd.name)) {
                categories.giveaway.commands.push(cmd);
            } else if (['botinfo', 'server', 'user', 'profile', 'pic', 'banner', 'help', 'helpall', 'ping', 'prefix', 'snipe', 'serverpic', 'serverbanner', 'botpic', 'botbanner', 'myperms'].includes(cmd.name)) {
                categories.info.commands.push(cmd);
            } else if (['ban', 'kick', 'mute', 'unmute', 'clear', 'lock', 'unlock', 'addrole', 'delrole', 'nick', 'unban', 'derank', 'renew', 'say', 'lockname', 'unlockname', 'slowmode', 'unmuteall', 'cmute', 'cunmute'].includes(cmd.name)) {
                categories.mod.commands.push(cmd);
            } else if (['eval', 'owner', 'owners', 'restart', 'boostmsg', 'unbanall', 'resetperms'].includes(cmd.name)) {
                categories.owner.commands.push(cmd);
            } else if (['create', 'rename', 'close', 'invite'].includes(cmd.name)) {
                categories.util.commands.push(cmd);
            } else {
                // Catégorie par défaut si non trouvée
                categories.util.commands.push(cmd);
            }
        });
        
        // Créer les pages pour chaque catégorie
        const pages = [];
        
        Object.entries(categories).forEach(([key, category]) => {
            if (category.commands.length > 0) {
                // Récupérer le préfixe du serveur
                const prefix = client.getPrefix(message.guild.id);
                
                // Créer la liste des commandes
                const commandList = category.commands.map(cmd => {
                    if (cmd.usage) {
                        return `\`${prefix}${cmd.name} ${cmd.usage}\``;
                    }
                    return `\`${prefix}${cmd.name}\``;
                }).join('\n');
                
                const embed = new EmbedBuilder()
                    .setTitle(`${category.name || key.toUpperCase()}`)
                    .setDescription(`**Préfixe:** \`${prefix}\`\n\n**Commandes disponibles:**\n${commandList}`)
                    .setColor('#2C2F33') // Noir
                    .setFooter({ text: `Page ${pages.length + 1} • Utilise les flèches pour naviguer` })
                    .setTimestamp();
                
                pages.push(embed);
            }
        });
        
        if (pages.length === 0) {
            return message.reply('Aucune commande disponible.');
        }
        
        // Créer les boutons de navigation
        let currentPage = 0;
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('prev')
                    .setLabel('◀')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true),
                new ButtonBuilder()
                    .setCustomId('next')
                    .setLabel('▶')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(pages.length === 1),
                new ButtonBuilder()
                    .setCustomId('stop')
                    .setLabel('X')
                    .setStyle(ButtonStyle.Danger)
            );
        
        // Envoyer le premier embed
        const msg = await message.reply({ 
            embeds: [pages[currentPage]], 
            components: [row] 
        });
        
        // Créer le collector pour les interactions
        const collector = msg.createMessageComponentCollector({ 
            time: 60000 // 60 secondes
        });
        
        collector.on('collect', async (interaction) => {
            if (interaction.user.id !== message.author.id) {
                return interaction.reply({ 
                    content: 'Seul l\'auteur peut utiliser ces boutons!', 
                    ephemeral: true 
                });
            }
            
            await interaction.deferUpdate();
            
            if (interaction.customId === 'prev') {
                currentPage = Math.max(0, currentPage - 1);
            } else if (interaction.customId === 'next') {
                currentPage = Math.min(pages.length - 1, currentPage + 1);
            } else if (interaction.customId === 'stop') {
                collector.stop();
                return msg.edit({ components: [] });
            }
            
            // Recréer les boutons avec les bons états
            const newRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('prev')
                        .setLabel('◀')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(currentPage === 0),
                    new ButtonBuilder()
                        .setCustomId('next')
                        .setLabel('▶')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(currentPage === pages.length - 1),
                    new ButtonBuilder()
                        .setCustomId('stop')
                        .setLabel('X')
                        .setStyle(ButtonStyle.Danger)
                );
            
            await msg.edit({ 
                embeds: [pages[currentPage]], 
                components: [newRow] 
            });
        });
        
        collector.on('end', () => {
            msg.edit({ components: [] }).catch(() => {});
        });
        } catch (error) {
            console.error('Erreur dans la commande help:', error);
            return message.reply('Une erreur est survenue lors de l\'affichage de l\'aide.');
        }
    }
};
