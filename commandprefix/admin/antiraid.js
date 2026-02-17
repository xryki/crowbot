const { PermissionsBitField, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'antiraid',
    description: 'Configure le système anti-raid par serveur',
    permissions: PermissionsBitField.Flags.Administrator,
    async execute(message, args, client) {
        // Vérifier si l'utilisateur est un owner
        if (!client.isOwner(message.author.id, message.guild.id)) {
            return message.reply('Commande réservée aux owners du bot.');
        }
        
        const guildId = message.guild.id;
        
        // Initialiser la configuration anti-raid pour ce serveur si elle n'existe pas
        if (!client.serverAntiraid) {
            client.serverAntiraid = new Map();
        }
        
        if (!client.serverAntiraid.has(guildId)) {
            client.serverAntiraid.set(guildId, {
                enabled: false,
                antiLink: {
                    enabled: true,
                    action: 'delete',
                    whitelist: []
                },
                antiSpam: {
                    enabled: false,
                    maxMessages: 5,
                    timeWindow: 10000,
                    action: 'mute',
                    whitelist: []
                },
                antiToken: {
                    enabled: true,
                    maxAccountAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
                    action: 'kick',
                    whitelist: []
                },
                antiWebhook: {
                    enabled: true,
                    action: 'delete',
                    whitelist: []
                },
                antiBot: {
                    enabled: false,
                    action: 'kick'
                },
                antiMassMention: {
                    enabled: false,
                    maxMentions: 5,
                    action: 'mute'
                },
                antiCaps: {
                    enabled: false,
                    maxCaps: 50,
                    action: 'delete'
                },
                antiInvite: {
                    enabled: false,
                    action: 'delete'
                },
                antiBan: {
                    enabled: true,
                    maxBans: 3,
                    timeWindow: 60000,
                    action: 'lockdown',
                    whitelist: []
                },
                logChannel: null
            });
        }
        
        const subcommand = args[0]?.toLowerCase();
        
        if (!subcommand) {
            // Afficher le statut actuel
            const config = client.serverAntiraid.get(guildId);
            const status = config.enabled ? 'Activé' : 'Désactivé';
            
            const embed = new EmbedBuilder()
                .setTitle(`️ Anti-Raid - ${message.guild.name}`)
                .setDescription(`Statut général: ${status}`)
                .setColor(config.enabled ? '00ff00' : 'ff0000')
                .setThumbnail(message.guild.iconURL({ dynamic: true, size: 512 }))
                .setTimestamp()
                .addFields(
                    { 
                        name: ' Anti-Link', 
                        value: `${config.antiLink.enabled ? '' : ''} - Action: ${config.antiLink.action}`, 
                        inline: true 
                    },
                    { 
                        name: ' Anti-Spam', 
                        value: `${config.antiSpam.enabled ? '' : ''} - Max: ${config.antiSpam.maxMessages} msgs`, 
                        inline: true 
                    },
                    { 
                        name: ' Anti-Token', 
                        value: `${config.antiToken.enabled ? '' : ''} - Action: ${config.antiToken.action}`, 
                        inline: true 
                    },
                    { 
                        name: ' Anti-Webhook', 
                        value: `${config.antiWebhook.enabled ? '' : ''} - Action: ${config.antiWebhook.action}`, 
                        inline: true 
                    },
                    { 
                        name: ' Anti-Bot', 
                        value: `${config.antiBot.enabled ? '' : ''} - Action: ${config.antiBot.action}`, 
                        inline: true 
                    },
                    { 
                        name: ' Anti-Mass Mention', 
                        value: `${config.antiMassMention.enabled ? '' : ''} - Max: ${config.antiMassMention.maxMentions}`, 
                        inline: true 
                    },
                    { 
                        name: ' Anti-Caps', 
                        value: `${config.antiCaps.enabled ? '' : ''} - Max: ${config.antiCaps.maxCaps}%`, 
                        inline: true 
                    },
                    { 
                        name: ' Anti-Invite', 
                        value: `${config.antiInvite.enabled ? '' : ''} - Action: ${config.antiInvite.action}`, 
                        inline: true 
                    },
                    { 
                        name: ' Anti-Ban Massif', 
                        value: `${config.antiBan.enabled ? '' : ''} - Max: ${config.antiBan.maxBans} bans`, 
                        inline: true 
                    }
                );
            
            if (config.logChannel) {
                const logChannel = message.guild.channels.cache.get(config.logChannel);
                if (logChannel) {
                    embed.addFields({
                        name: ' Salon de logs',
                        value: `<${logChannel.name}>`,
                        inline: false
                    });
                }
            }
            
            return message.reply({ embeds: [embed] });
        }
        
        const config = client.serverAntiraid.get(guildId);
        
        switch (subcommand) {
            case 'enable':
                config.enabled = true;
                await message.reply(' Système anti-raid activé pour ce serveur.');
                break;
                
            case 'disable':
                config.enabled = false;
                await message.reply(' Système anti-raid désactivé pour ce serveur.');
                break;
                
            case 'antilink':
                await this.toggleFeature(message, config, 'antiLink', args[1]);
                break;
                
            case 'antispam':
                await this.configureAntiSpam(message, config, args.slice());
                break;
                
            case 'antitoken':
                await this.configureAntiToken(message, config, args.slice());
                break;
                
            case 'antiwebhook':
                await this.toggleFeature(message, config, 'antiWebhook', args[1]);
                break;
                
            case 'antibot':
                await this.toggleFeature(message, config, 'antiBot', args[1]);
                break;
                
            case 'antimassmention':
                await this.configureAntiMassMention(message, config, args.slice());
                break;
                
            case 'anticaps':
                await this.configureAntiCaps(message, config, args.slice());
                break;
                
            case 'antiinvite':
                await this.toggleFeature(message, config, 'antiInvite', args[1]);
                break;
                
            case 'antiban':
                await this.configureAntiBan(message, config, args.slice());
                break;
                
            case 'logs':
                await this.setLogChannel(message, config, args[1]);
                break;
                
            case 'whitelist':
                await this.manageWhitelist(message, config, args.slice());
                break;
                
            case 'reset':
                await this.resetConfig(message, config);
                break;
                
            default:
                const helpEmbed = new EmbedBuilder()
                    .setTitle('️ Anti-Raid - Aide')
                    .setColor('FFFFFF')
                    .setDescription('Syntaxe: `!antiraid [sous-commande] [arguments]`')
                    .addFields(
                        { 
                            name: ' Général', 
                            value: '`enable` - Activer l\'anti-raid\n`disable` - Désactiver l\'anti-raid\n`reset` - Réinitialiser la configuration\n`logs` - Définir le salon de logs', 
                            inline: false 
                        },
                        { 
                            name: '️ Protections', 
                            value: '`antilink [on/off]` - Anti-liens\n`antispam [on/off] [max] [temps]` - Anti-spam\n`antitoken [on/off] [jours]` - Anti-comptes récents\n`antiwebhook [on/off]` - Anti-webhooks', 
                            inline: false 
                        },
                        { 
                            name: '️ Protections (suite)', 
                            value: '`antibot [on/off]` - Anti-bots\n`antimassmention [on/off] [max]` - Anti-mentions massives\n`anticaps [on/off] [pourcentage]` - Anti-majuscules\n`antiinvite [on/off]` - Anti-invitations Discord', 
                            inline: false 
                        },
                        { 
                            name: ' Avancé', 
                            value: '`antiban [on/off] [max] [temps]` - Anti-bans massifs\n`whitelist [add/remove/list] [@user]` - Gérer la whitelist', 
                            inline: false 
                        }
                    )
                    .setTimestamp();
                
                await message.reply({ embeds: [helpEmbed] });
        }
        
        // Sauvegarder automatiquement
        client.saveData();
    },
    
    async toggleFeature(message, config, feature, action) {
        if (!action || (action !== 'on' && action !== 'off')) {
            return message.reply(` Usage: !antiraid ${feature} [on/off]`);
        }
        
        config[feature].enabled = action === 'on';
        await message.reply(` ${feature} ${action === 'on' ? 'activé' : 'désactivé'}.`);
    },
    
    async configureAntiSpam(message, config, args) {
        if (!args[0] || (args[0] !== 'on' && args[0] !== 'off')) {
            return message.reply(' Usage: !antiraid antispam [on/off] [max_messages] [time_window_ms]');
        }
        
        config.antiSpam.enabled = args[0] === 'on';
        
        if (args[1]) {
            const maxMsg = parseInt(args[1]);
            if (!isNaN(maxMsg) && maxMsg > 0) {
                config.antiSpam.maxMessages = maxMsg;
            }
        }
        
        if (args[2]) {
            const timeWindow = parseInt(args[2]);
            if (!isNaN(timeWindow) && timeWindow > 0) {
                config.antiSpam.timeWindow = timeWindow;
            }
        }
        
        await message.reply(` Anti-Spam configuré: ${args[0]} - Max: ${config.antiSpam.maxMessages} msgs - Temps: ${config.antiSpam.timeWindow}ms`);
    },
    
    async configureAntiToken(message, config, args) {
        if (!args[0] || (args[0] !== 'on' && args[0] !== 'off')) {
            return message.reply(' Usage: !antiraid antitoken [on/off] [max_age_days]');
        }
        
        config.antiToken.enabled = args[0] === 'on';
        
        if (args[1]) {
            const maxDays = parseInt(args[1]);
            if (!isNaN(maxDays) && maxDays > 0) {
                config.antiToken.maxAccountAge = maxDays * 24 * 60 * 60 * 1000;
            }
        }
        
        const days = Math.floor(config.antiToken.maxAccountAge / (24 * 60 * 60 * 1000));
        await message.reply(` Anti-Token configuré: ${args[0]} - Max âge: ${days} jours`);
    },
    
    async configureAntiMassMention(message, config, args) {
        if (!args[0] || (args[0] !== 'on' && args[0] !== 'off')) {
            return message.reply(' Usage: !antiraid antimassmention [on/off] [max_mentions]');
        }
        
        config.antiMassMention.enabled = args[0] === 'on';
        
        if (args[1]) {
            const maxMentions = parseInt(args[1]);
            if (!isNaN(maxMentions) && maxMentions > 0) {
                config.antiMassMention.maxMentions = maxMentions;
            }
        }
        
        await message.reply(` Anti-Mass Mention configuré: ${args[0]} - Max: ${config.antiMassMention.maxMentions} mentions`);
    },
    
    async configureAntiCaps(message, config, args) {
        if (!args[0] || (args[0] !== 'on' && args[0] !== 'off')) {
            return message.reply(' Usage: !antiraid anticaps [on/off] [max_percentage]');
        }
        
        config.antiCaps.enabled = args[0] === 'on';
        
        if (args[1]) {
            const maxCaps = parseInt(args[1]);
            if (!isNaN(maxCaps) && maxCaps > 0 && maxCaps <= 100) {
                config.antiCaps.maxCaps = maxCaps;
            }
        }
        
        await message.reply(` Anti-Caps configuré: ${args[0]} - Max: ${config.antiCaps.maxCaps}%`);
    },
    
    async configureAntiBan(message, config, args) {
        if (!args[0] || (args[0] !== 'on' && args[0] !== 'off')) {
            return message.reply(' Usage: !antiraid antiban [on/off] [max_bans] [time_window_ms]');
        }
        
        config.antiBan.enabled = args[0] === 'on';
        
        if (args[1]) {
            const maxBans = parseInt(args[1]);
            if (!isNaN(maxBans) && maxBans > 0) {
                config.antiBan.maxBans = maxBans;
            }
        }
        
        if (args[2]) {
            const timeWindow = parseInt(args[2]);
            if (!isNaN(timeWindow) && timeWindow > 0) {
                config.antiBan.timeWindow = timeWindow;
            }
        }
        
        await message.reply(` Anti-Ban Massif configuré: ${args[0]} - Max: ${config.antiBan.maxBans} bans - Temps: ${config.antiBan.timeWindow}ms`);
    },
    
    async setLogChannel(message, config, channelId) {
        if (!channelId) {
            config.logChannel = null;
            return message.reply(' Salon de logs désactivé.');
        }
        
        const channel = message.mentions.channels.first() || message.guild.channels.cache.get(channelId);
        if (!channel) {
            return message.reply(' Salon introuvable.');
        }
        
        config.logChannel = channel.id;
        await message.reply(`Salon de logs défini: <#${channel.id}>`);
    },
    
    async manageWhitelist(message, config, args) {
        const action = args[0]?.toLowerCase();
        
        if (!action || !['add', 'remove', 'list'].includes(action)) {
            return message.reply(' Usage: !antiraid whitelist [add/remove/list] [@user]');
        }
        
        if (action === 'list') {
            if (config.antiLink.whitelist.length === 0 && 
                config.antiSpam.whitelist.length === 0 && 
                config.antiToken.whitelist.length === 0) {
                return message.reply(' Aucun utilisateur dans la whitelist.');
            }
            
            const allWhitelisted = new Set([
                ...config.antiLink.whitelist,
                ...config.antiSpam.whitelist,
                ...config.antiToken.whitelist
            ]);
            
            let whitelistText = '';
            for (const userId of allWhitelisted) {
                try {
                    const user = await message.client.users.fetch(userId);
                    whitelistText += `• ${user.tag} (${userId})\n`;
                } catch {
                    whitelistText += `• Utilisateur inconnu (${userId})\n`;
                }
            }
            
            const embed = new EmbedBuilder()
                .setTitle(' Whitelist Anti-Raid')
                .setDescription(whitelistText)
                .setColor('FFFFFF')
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
        
        if (action === 'add' || action === 'remove') {
            const user = message.mentions.users.first();
            if (!user) {
                return message.reply(' Veuillez mentionner un utilisateur.');
            }
            
            const features = ['antiLink', 'antiSpam', 'antiToken'];
            const feature = args[1]?.toLowerCase();
            
            if (feature && features.includes(feature)) {
                if (action === 'add') {
                    if (!config[feature].whitelist.includes(user.id)) {
                        config[feature].whitelist.push(user.id);
                        await message.reply(` ${user.tag} ajouté à la whitelist de ${feature}.`);
                    } else {
                        await message.reply(` ${user.tag} est déjà dans la whitelist de ${feature}.`);
                    }
                } else {
                    const index = config[feature].whitelist.indexOf(user.id);
                    if (index > -1) {
                        config[feature].whitelist.splice(index, 1);
                        await message.reply(` ${user.tag} retiré de la whitelist de ${feature}.`);
                    } else {
                        await message.reply(` ${user.tag} n\'est pas dans la whitelist de ${feature}.`);
                    }
                }
            } else {
                // Ajouter/retirer de toutes les whitelists
                for (const feat of features) {
                    if (action === 'add') {
                        if (!config[feat].whitelist.includes(user.id)) {
                            config[feat].whitelist.push(user.id);
                        }
                    } else {
                        const index = config[feat].whitelist.indexOf(user.id);
                        if (index > -1) {
                            config[feat].whitelist.splice(index, 1);
                        }
                    }
                }
                await message.reply(` ${user.tag} ${action === 'add' ? 'ajouté à' : 'retiré de'} toutes les whitelists anti-raid.`);
            }
        }
    },
    
    async resetConfig(message, config) {
        // Réinitialiser à la configuration par défaut
        Object.assign(config, {
            enabled: false,
            antiLink: {
                enabled: true,
                action: 'delete',
                whitelist: []
            },
            antiSpam: {
                enabled: false,
                maxMessages: 5,
                timeWindow: 10000,
                action: 'mute',
                whitelist: []
            },
            antiToken: {
                enabled: true,
                maxAccountAge: 7 * 24 * 60 * 60 * 1000,
                action: 'kick',
                whitelist: []
            },
            antiWebhook: {
                enabled: true,
                action: 'delete',
                whitelist: []
            },
            antiBot: {
                enabled: false,
                action: 'kick'
            },
            antiMassMention: {
                enabled: false,
                maxMentions: 5,
                action: 'mute'
            },
            antiCaps: {
                enabled: false,
                maxCaps: 50,
                action: 'delete'
            },
            antiInvite: {
                enabled: false,
                action: 'delete'
            },
            antiBan: {
                enabled: true,
                maxBans: 3,
                timeWindow: 60000,
                action: 'lockdown',
                whitelist: []
            },
            logChannel: null
        });
        
        await message.reply(' Configuration anti-raid réinitialisée.');
    }
};
