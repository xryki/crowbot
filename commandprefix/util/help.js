const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    name: 'help',
    description: 'Affiche toutes les commandes du bot',
    skipLogging: true,
    async execute(message, args, client) {
        try {
            const prefix = client.getPrefix(message.guild.id);
            
            // Regrouper les commandes par catégorie
            const categories = {
                fun: { name: 'Fun', commands: [] },
                info: { name: 'Informations', commands: [] },
                mod: { name: 'Modération', commands: [] },
                admin: { name: 'Administration', commands: [] },
                owner: { name: 'Owner', commands: [] }
            };
            
            client.prefixCommands.forEach(cmd => {
                if (!cmd || !cmd.name) return;
                
                // Ignorer les commandes owner privées
                if (['owners', 'ownerlist', 'setowner', 'serverowners'].includes(cmd.name)) return;
                
                // Déterminer la catégorie
                if (['8ball', 'coinflip'].includes(cmd.name)) {
                    categories.fun.commands.push(cmd);
                } else if (['botinfo', 'server', 'user', 'profile', 'pic', 'banner', 'help', 'helpall', 'ping', 'prefix', 'snipe'].includes(cmd.name)) {
                    categories.info.commands.push(cmd);
                } else if (['ban', 'kick', 'mute', 'unmute', 'clear', 'lock', 'unlock', 'addrole', 'delrole', 'nick', 'unban', 'derank', 'renew', 'say', 'lockname', 'unlockname', 'unlocknameall', 'locknamelist', 'slowmode', 'unmuteall', 'cmute', 'cunmute'].includes(cmd.name)) {
                    categories.mod.commands.push(cmd);
                } else if (['autorole', 'setup', 'bl', 'unbl', 'wl', 'unwl', 'wls', 'wlclear', 'blclear', 'logs', 'antiraid', 'welcome', 'ticket', 'massrole', 'gw', 'serverpic', 'serverbanner', 'testghostping', 'ghostping', 'ghostpinguser', 'hideall', 'unhideall', 'mv', 'find'].includes(cmd.name)) {
                    categories.admin.commands.push(cmd);
                } else if (['eval', 'owner', 'restart', 'boostmsg', 'unbanall', 'invite', 'backup', 'restore', 'deletebackup', 'hide', 'unhide', 'botpic', 'botbanner'].includes(cmd.name)) {
                    categories.owner.commands.push(cmd);
                } else {
                    // Commandes utilitaires dans info
                    categories.info.commands.push(cmd);
                }
            });
            
            // Créer les pages
            const pages = [];
            
            Object.entries(categories).forEach(([key, category]) => {
                if (category.commands.length === 0) return;
                
                // Filtrer les commandes selon si l'utilisateur peut les utiliser
                const isOwner = client.isOwner(message.author.id);
                let availableCommands = category.commands;
                
                if (key === 'owner' && !isOwner) {
                    return; // Ne pas afficher la catégorie owner si pas owner
                }
                
                // Trier les commandes par nom
                availableCommands.sort((a, b) => a.name.localeCompare(b.name));
                
                const commandList = availableCommands.map(cmd => {
                    const cmdText = cmd.usage ? `\`${prefix}${cmd.name} ${cmd.usage}\`` : `\`${prefix}${cmd.name}\``;
                    const description = cmd.description ? ` - *${cmd.description}*` : '';
                    return `${cmdText}${description}`;
                }).join('\n');
                
                const embed = new EmbedBuilder()
                    .setTitle(`${category.name}`)
                    .setDescription(`**Préfixe:** \`${prefix}\`\n\n${commandList}`)
                    .setColor('#FFFFFF')
                    .setFooter({ text: `Page ${pages.length + 1} • Utilise les flèches pour naviguer` })
                    .setTimestamp();
                
                pages.push(embed);
            });
            
            if (pages.length === 0) {
                return message.reply('Aucune commande disponible.');
            }
            
            // Navigation
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
            
            const msg = await message.reply({ 
                embeds: [pages[currentPage]], 
                components: [row] 
            });
            
            const collector = msg.createMessageComponentCollector({ 
                time: 60000 
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
