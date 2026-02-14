const { PermissionsBitField, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    name: 'ticket',
    description: 'Configure le système de tickets',
    permissions: PermissionsBitField.Flags.Administrator,
    async execute(message, args, client) {
        const guild = message.guild;
        
        // Initialiser les données de tickets si elles n'existent pas
        if (!client.tickets) {
            client.tickets = new Map();
        }
        
        const subcommand = args[0]?.toLowerCase();

        const getGuildConfig = () => {
            const existing = client.tickets.get(guild.id);
            if (!existing) {
                return { panels: {} };
            }
            if (existing.panels) {
                return existing;
            }
            return { panels: { support: existing } };
        };

        const getPanelKey = (index, defaultKey = 'support') => {
            const raw = args[index];
            if (!raw) return defaultKey;
            if (/^<#[0-9]+>$/.test(raw)) return defaultKey;
            if (/^<@&[0-9]+>$/.test(raw)) return defaultKey;
            if (/^[0-9]+$/.test(raw)) return defaultKey;
            return raw.toLowerCase();
        };
        
        if (!subcommand) {
            // Afficher le statut actuel
            const ticketData = client.tickets.get(guild.id);
            if (!ticketData) {
                return message.reply(`Aucun système de ticket configuré. Utilisez \`${client.getPrefix(message.guild.id)}ticket setup\` pour en créer un.`);
            }

            if (ticketData.panels) {
                const panelKeys = Object.keys(ticketData.panels);
                if (panelKeys.length === 0) {
                    return message.reply('Aucun panel de tickets configuré.');
                }
                const lines = panelKeys.map(key => {
                    const panel = ticketData.panels[key];
                    const channelId = panel?.channelId;
                    return channelId ? `${key}: <#${channelId}>` : `${key}: non configuré`;
                });
                return message.reply(`Panels de tickets configurés :\n${lines.join('\n')}`);
            }

            return message.reply(`Système de tickets configuré dans <#${ticketData.channelId}>`);
        }
        
        switch (subcommand) {
            case 'setup':
                {
                const panelKey = getPanelKey(1);
                const channel = message.mentions.channels.first();
                if (!channel) {
                    return message.reply('Mentionne un salon pour les tickets !');
                }

                const ticketEmbed = new EmbedBuilder()
                    .setTitle(panelKey === 'recrutement' ? 'Recrutement - Tickets' : 'Support - Tickets')
                    .setDescription('Cliquez sur le bouton ci-dessous pour créer un ticket.')
                    .setColor('#FFFFFF')
                    .setTimestamp();

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`create_ticket:${panelKey}`)
                        .setLabel(panelKey === 'recrutement' ? 'Candidature Staff' : 'Créer un ticket')
                        .setStyle(ButtonStyle.Primary)
                );

                const cfg = getGuildConfig();
                cfg.panels[panelKey] = cfg.panels[panelKey] || {
                    channelId: channel.id,
                    categoryId: null,
                    transcriptChannelId: null,
                    supportRoles: [],
                    guildId: guild.id
                };
                cfg.panels[panelKey].channelId = channel.id;

                client.tickets.set(guild.id, cfg);
                
                // Sauvegarder automatiquement
                client.saveData();

                await channel.send({ embeds: [ticketEmbed], components: [row] });
                
                await message.reply(`Panel "${panelKey}" configuré dans <#${channel.id}>.\nCommandes :\n- \`${client.getPrefix(message.guild.id)}ticket category ${panelKey} <catégorie ou id>\`\n- \`${client.getPrefix(message.guild.id)}ticket transcript ${panelKey} <salon>\`\n- \`${client.getPrefix(message.guild.id)}ticket addrole ${panelKey} <@rôle>\`\n- \`${client.getPrefix(message.guild.id)}ticket removerole ${panelKey} <@rôle>\``);
                break;
                }
                
            case 'category':
                {
                const panelKey = getPanelKey(1);
                const argIndex = panelKey === 'support' ? 1 : 2;

                let category = message.mentions.channels.first();
                if (!category && args[argIndex] && /^\d+$/.test(args[argIndex])) {
                    category = guild.channels.cache.get(args[argIndex]) || await guild.channels.fetch(args[argIndex]).catch(() => null);
                }
                if (!category || category.type !== 4) {
                    return message.reply('Mentionne une catégorie de salon ou donne son ID !');
                }

                const cfg = getGuildConfig();
                if (!cfg.panels[panelKey]) {
                    return message.reply('Configure d\'abord le système avec `!ticket setup`');
                }

                cfg.panels[panelKey].categoryId = category.id;
                client.tickets.set(guild.id, cfg);
                
                // Sauvegarder automatiquement
                client.saveData();
                
                await message.reply(`Catégorie du panel "${panelKey}" configurée : ${category.name}`);
                break;
                }
                
            case 'addrole':
                {
                const panelKey = getPanelKey(1);
                const roleToAdd = message.mentions.roles.first();
                if (!roleToAdd) {
                    return message.reply('Mentionne un rôle à ajouter comme support !');
                }

                const cfg = getGuildConfig();
                if (!cfg.panels[panelKey]) {
                    return message.reply('Configure d\'abord le système avec `!ticket setup`');
                }

                cfg.panels[panelKey].supportRoles = cfg.panels[panelKey].supportRoles || [];
                if (!cfg.panels[panelKey].supportRoles.includes(roleToAdd.id)) {
                    cfg.panels[panelKey].supportRoles.push(roleToAdd.id);
                    client.tickets.set(guild.id, cfg);
                    
                    // Sauvegarder automatiquement
                    client.saveData();
                    
                    await message.reply(`Rôle ${roleToAdd.name} ajouté au support du panel "${panelKey}".`);
                } else {
                    await message.reply('Ce rôle a déjà accès au support des tickets.');
                }
                break;
                }
                
            case 'removerole':
                {
                const panelKey = getPanelKey(1);
                const roleToRemove = message.mentions.roles.first();
                if (!roleToRemove) {
                    return message.reply('Mentionne un rôle à retirer du support !');
                }

                const cfg = getGuildConfig();
                if (!cfg.panels[panelKey]) {
                    return message.reply('Configure d\'abord le système avec `!ticket setup`');
                }

                cfg.panels[panelKey].supportRoles = cfg.panels[panelKey].supportRoles || [];
                const index = cfg.panels[panelKey].supportRoles.indexOf(roleToRemove.id);
                if (index > -1) {
                    cfg.panels[panelKey].supportRoles.splice(index, 1);
                    client.tickets.set(guild.id, cfg);
                    
                    // Sauvegarder automatiquement
                    client.saveData();
                    
                    await message.reply(`Rôle ${roleToRemove.name} retiré du support du panel "${panelKey}".`);
                } else {
                    await message.reply('Ce rôle n\'a pas accès au support des tickets.');
                }
                break;
                }
                
            case 'transcript':
                {
                const panelKey = getPanelKey(1);
                const argIndex = panelKey === 'support' ? 1 : 2;

                let transcriptChannel = message.mentions.channels.first();
                if (!transcriptChannel && args[argIndex] && /^\d+$/.test(args[argIndex])) {
                    transcriptChannel = guild.channels.cache.get(args[argIndex]) || await guild.channels.fetch(args[argIndex]).catch(() => null);
                }
                if (!transcriptChannel) {
                    return message.reply('Mentionne un salon pour les transcripts ou donne son ID !');
                }

                const cfg = getGuildConfig();
                if (!cfg.panels[panelKey]) {
                    return message.reply('Configure d\'abord le système avec `!ticket setup`');
                }

                cfg.panels[panelKey].transcriptChannelId = transcriptChannel.id;
                client.tickets.set(guild.id, cfg);
                
                // Sauvegarder automatiquement
                client.saveData();
                
                await message.reply(`Salon des transcripts du panel "${panelKey}" configuré : ${transcriptChannel.name}`);
                break;
                }
                
            case 'support':
                const supportRole = message.mentions.roles.first();
                if (!supportRole) {
                    return message.reply('Mentionne un rôle de support !');
                }
                
                const supportData = client.tickets.get(guild.id);
                if (!supportData) {
                    return message.reply('Configure d\'abord le système avec `!ticket setup`');
                }
                
                supportData.supportRoleId = supportRole.id;
                client.tickets.set(guild.id, supportData);
                
                // Sauvegarder automatiquement
                client.saveData();
                
                await message.reply(`Rôle de support configuré : ${supportRole.name}`);
                break;
                
            case 'disable':
                client.tickets.delete(guild.id);
                
                // Sauvegarder automatiquement
                client.saveData();
                
                await message.reply('Système de tickets désactivé.');
                break;
                
            default:
                await message.reply(`Usage: \`${client.getPrefix(message.guild.id)}ticket [setup|category|transcript|addrole|removerole|disable]\`\n\nDétails :\n- \`setup [panel] <salon>\`\n- \`category [panel] <catégorie ou id>\`\n- \`transcript [panel] <salon ou id>\`\n- \`addrole [panel] <@rôle>\`\n- \`removerole [panel] <@rôle>\`\n- \`disable\``);
        }
    }
};
