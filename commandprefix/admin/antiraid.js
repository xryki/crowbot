const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'antiraid',
    description: 'Configure le système anti-raid (anti-link, anti-token, anti-ban)',
    permissions: PermissionsBitField.Flags.Administrator,
    async execute(message, args, client) {
        // Vérifier si l'utilisateur est owner du bot
        if (!client.isOwner(message.author.id)) {
            return message.reply('Commande réservée aux owners du bot.');
        }
        
        // Initialiser les données anti-raid si elles n'existent pas
        if (!client.antiraid) {
            console.log('Initialisation de client.antiraid (était undefined)');
            client.antiraid = {
                enabled: false,
                antiLink: {
                    enabled: true,
                    action: 'delete', // delete, warn, kick
                    whitelist: []
                },
                antiSpam: {
                    enabled: false,
                    maxMessages: 5,
                    timeWindow: 5000,
                    action: 'mute',
                    whitelist: []
                },
                antiToken: {
                    enabled: true,
                    maxAccountAge:7 * 24 * 60 * 60 * 1000, // 7 jours en ms
                    action: 'kick', // kick, ban
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
                    maxCaps: 70,
                    action: 'delete'
                },
                antiInvite: {
                    enabled: false,
                    action: 'delete'
                },
                antiBan: {
                    enabled: true,
                    maxBans: 3, // Nombre de bans en X secondes
                    timeWindow: 10000, // 10 secondes
                    action: 'lockdown', // lockdown, notify
                    whitelist: [] // Modérateurs autorisés
                },
                globalWhitelist: [], // Whitelist globale pour toutes les protections
                logChannel: null // Salon pour les logs anti-raid
            };
        }
        
        // Mettre à jour automatiquement la whitelist avec tous les owners
        client.updateAntiRaidWhitelist();
        
        const guildId = message.guild.id;
        
        if (!args[0]) {
            // S'assurer que tous les modules existent avant d'afficher le statut
            if (!client.antiraid.antiLink) {
                client.antiraid.antiLink = { enabled: false, action: 'delete' };
            }
            if (!client.antiraid.antiSpam) {
                client.antiraid.antiSpam = { enabled: false, maxMessages: 5, timeWindow: 5000, action: 'mute' };
            }
            if (!client.antiraid.antiToken) {
                client.antiraid.antiToken = { enabled: false, maxAccountAge: 7 * 24 * 60 * 60 * 1000, action: 'kick' };
            }
            if (!client.antiraid.antiWebhook) {
                client.antiraid.antiWebhook = { enabled: false, action: 'delete' };
            }
            if (!client.antiraid.antiBot) {
                client.antiraid.antiBot = { enabled: false, action: 'kick' };
            }
            if (!client.antiraid.antiMassMention) {
                client.antiraid.antiMassMention = { enabled: false, maxMentions: 5, action: 'mute' };
            }
            if (!client.antiraid.antiCaps) {
                client.antiraid.antiCaps = { enabled: false, maxCaps: 70, action: 'delete' };
            }
            if (!client.antiraid.antiInvite) {
                client.antiraid.antiInvite = { enabled: false, action: 'delete' };
            }
            if (!client.antiraid.antiBan) {
                client.antiraid.antiBan = { enabled: false, maxBans: 3, timeWindow: 10000, action: 'lockdown' };
            }
            if (!client.antiraid.globalWhitelist) {
                client.antiraid.globalWhitelist = [];
            }
            
            // Afficher le statut actuel
            const status = client.antiraid.enabled ? 'Activé' : 'Désactivé';
            const embed = {
                title: 'Système Anti-Raid',
                description: `**Statut général:** ${status}`,
                color: client.antiraid.enabled ? 0x00ff00 : 0xff0000,
                fields: [
                    { 
                        name: 'Anti-Link', 
                        value: `${client.antiraid.antiLink.enabled ? 'Activé' : 'Désactivé'} - Action: ${client.antiraid.antiLink.action}`, 
                        inline: true 
                    },
                    { 
                        name: 'Anti-Spam', 
                        value: `${client.antiraid.antiSpam.enabled ? 'Activé' : 'Désactivé'} - Max: ${client.antiraid.antiSpam.maxMessages} msgs`, 
                        inline: true 
                    },
                    { 
                        name: 'Anti-Token', 
                        value: `${client.antiraid.antiToken.enabled ? 'Activé' : 'Désactivé'} - Action: ${client.antiraid.antiToken.action}`, 
                        inline: true 
                    },
                    { 
                        name: 'Anti-Webhook', 
                        value: `${client.antiraid.antiWebhook.enabled ? 'Activé' : 'Désactivé'} - Action: ${client.antiraid.antiWebhook.action}`, 
                        inline: true 
                    },
                    { 
                        name: 'Anti-Bot', 
                        value: `${client.antiraid.antiBot.enabled ? 'Activé' : 'Désactivé'} - Action: ${client.antiraid.antiBot.action}`, 
                        inline: true 
                    },
                    { 
                        name: 'Anti-Mass Mention', 
                        value: `${client.antiraid.antiMassMention.enabled ? 'Activé' : 'Désactivé'} - Max: ${client.antiraid.antiMassMention.maxMentions}`, 
                        inline: true 
                    },
                    { 
                        name: 'Anti-Caps', 
                        value: `${client.antiraid.antiCaps.enabled ? 'Activé' : 'Désactivé'} - Max: ${client.antiraid.antiCaps.maxCaps}%`, 
                        inline: true 
                    },
                    { 
                        name: 'Anti-Invite', 
                        value: `${client.antiraid.antiInvite.enabled ? 'Activé' : 'Désactivé'} - Action: ${client.antiraid.antiInvite.action}`, 
                        inline: true 
                    },
                    { 
                        name: 'Anti-Ban Massif', 
                        value: `${client.antiraid.antiBan.enabled ? 'Activé' : 'Désactivé'} - Max: ${client.antiraid.antiBan.maxBans} bans`, 
                        inline: true 
                    },
                    { 
                        name: 'Whitelist Globale', 
                        value: client.antiraid.globalWhitelist.length > 0 ? 
                            client.antiraid.globalWhitelist.map(id => `<@${id}>`).join(', ') : 'Aucun', 
                        inline: false 
                    }
                ],
                timestamp: new Date()
            };
            
            return message.reply({ embeds: [embed] });
        }
        
        // S'assurer que tous les modules existent
        if (!client.antiraid.antiSpam) {
            client.antiraid.antiSpam = {
                enabled: false,
                maxMessages: 5,
                timeWindow: 5000,
                action: 'mute',
                whitelist: []
            };
        }
        if (!client.antiraid.antiWebhook) {
            client.antiraid.antiWebhook = {
                enabled: true,
                action: 'delete',
                whitelist: []
            };
        }
        if (!client.antiraid.antiBot) {
            client.antiraid.antiBot = {
                enabled: false,
                action: 'kick'
            };
        }
        if (!client.antiraid.antiMassMention) {
            client.antiraid.antiMassMention = {
                enabled: false,
                maxMentions: 5,
                action: 'mute'
            };
        }
        if (!client.antiraid.antiCaps) {
            client.antiraid.antiCaps = {
                enabled: false,
                maxCaps: 70,
                action: 'delete'
            };
        }
        if (!client.antiraid.antiInvite) {
            client.antiraid.antiInvite = {
                enabled: false,
                action: 'delete'
            };
        }
        
        const subcommand = args[0].toLowerCase();
        
        // Fonction pour sauvegarder la configuration anti-raid
        const saveAntiRaidConfig = () => {
            if (client.dataSaver) {
                client.dataSaver.saveData('antiraid', client.antiraid);
            }
        };
        
        switch (subcommand) {
            case 'enable':
            case 'on':
                client.antiraid.enabled = true;
                saveAntiRaidConfig();
                await message.reply('Système anti-raid activé.');
                break;
                
            case 'disable':
            case 'off':
                client.antiraid.enabled = false;
                saveAntiRaidConfig();
                await message.reply('Système anti-raid désactivé.');
                break;
                
            case 'antilink':
                if (!args[1]) {
                    return message.reply(`Anti-Link: ${client.antiraid.antiLink.enabled ? 'Activé' : 'Désactivé'} - Action: ${client.antiraid.antiLink.action}`);
                }
                
                if (args[1] === 'enable') {
                    client.antiraid.antiLink.enabled = true;
                    saveAntiRaidConfig();
                    await message.reply('Anti-Link activé.');
                } else if (args[1] === 'disable') {
                    client.antiraid.antiLink.enabled = false;
                    saveAntiRaidConfig();
                    await message.reply('Anti-Link désactivé.');
                } else if (args[1] === 'action' && args[2]) {
                    if (!['delete', 'warn', 'kick'].includes(args[2])) {
                        return message.reply('Action valide: delete, warn, kick');
                    }
                    client.antiraid.antiLink.action = args[2];
                    saveAntiRaidConfig();
                    await message.reply(`Action anti-link mise à jour: ${args[2]}`);
                }
                break;
                
            case 'antitoken':
                if (!args[1]) {
                    const days = Math.floor(client.antiraid.antiToken.maxAccountAge / (24 * 60 * 60 * 1000));
                    return message.reply(`Anti-Token: ${client.antiraid.antiToken.enabled ? 'Activé' : 'Désactivé'} - Max âge: ${days} jours - Action: ${client.antiraid.antiToken.action}`);
                }
                
                if (args[1] === 'enable') {
                    client.antiraid.antiToken.enabled = true;
                    saveAntiRaidConfig();
                    await message.reply('Anti-Token activé.');
                } else if (args[1] === 'disable') {
                    client.antiraid.antiToken.enabled = false;
                    saveAntiRaidConfig();
                    await message.reply('Anti-Token désactivé.');
                } else if (args[1] === 'age' && args[2]) {
                    const days = parseInt(args[2]);
                    if (isNaN(days) || days < 1) {
                        return message.reply('Âge valide: nombre de jours minimum');
                    }
                    client.antiraid.antiToken.maxAccountAge = days * 24 * 60 * 60 * 1000;
                    saveAntiRaidConfig();
                    await message.reply(`Âge minimum des comptes mis à jour: ${days} jours`);
                } else if (args[1] === 'action' && args[2]) {
                    if (!['kick', 'ban'].includes(args[2])) {
                        return message.reply('Action valide: kick, ban');
                    }
                    client.antiraid.antiToken.action = args[2];
                    saveAntiRaidConfig();
                    await message.reply(`Action anti-token mise à jour: ${args[2]}`);
                }
                break;
                
            case 'antiban':
                if (!args[1]) {
                    return message.reply(`Anti-Ban: ${client.antiraid.antiBan.enabled ? 'Activé' : 'Désactivé'} - Max: ${client.antiraid.antiBan.maxBans} bans en ${client.antiraid.antiBan.timeWindow/1000}s`);
                }
                
                if (args[1] === 'enable') {
                    client.antiraid.antiBan.enabled = true;
                    saveAntiRaidConfig();
                    await message.reply('Anti-Ban activé.');
                } else if (args[1] === 'disable') {
                    client.antiraid.antiBan.enabled = false;
                    saveAntiRaidConfig();
                    await message.reply('Anti-Ban désactivé.');
                } else if (args[1] === 'max' && args[2]) {
                    const max = parseInt(args[2]);
                    if (isNaN(max) || max < 1) {
                        return message.reply('Maximum valide: nombre de bans');
                    }
                    client.antiraid.antiBan.maxBans = max;
                    saveAntiRaidConfig();
                    await message.reply(`Maximum de bans mis à jour: ${max}`);
                } else if (args[1] === 'window' && args[2]) {
                    const seconds = parseInt(args[2]);
                    if (isNaN(seconds) || seconds < 1) {
                        return message.reply('Fenêtre valide: nombre de secondes');
                    }
                    client.antiraid.antiBan.timeWindow = seconds * 1000;
                    saveAntiRaidConfig();
                    await message.reply(`Fenêtre de temps mise à jour: ${seconds} secondes`);
                }
                break;
                
            case 'antispam':
                if (!args[1]) {
                    return message.reply(`Anti-Spam: ${client.antiraid.antiSpam.enabled ? 'Activé' : 'Désactivé'} - Max: ${client.antiraid.antiSpam.maxMessages} msgs en ${client.antiraid.antiSpam.timeWindow/1000}s - Action: ${client.antiraid.antiSpam.action}`);
                }
                
                if (args[1] === 'enable') {
                    client.antiraid.antiSpam.enabled = true;
                    saveAntiRaidConfig();
                    await message.reply('Anti-Spam activé.');
                } else if (args[1] === 'disable') {
                    client.antiraid.antiSpam.enabled = false;
                    saveAntiRaidConfig();
                    await message.reply('Anti-Spam désactivé.');
                } else if (args[1] === 'max' && args[2]) {
                    const max = parseInt(args[2]);
                    if (isNaN(max) || max < 1) {
                        return message.reply('Maximum valide: nombre de messages');
                    }
                    client.antiraid.antiSpam.maxMessages = max;
                    saveAntiRaidConfig();
                    await message.reply(`Maximum de messages mis à jour: ${max}`);
                } else if (args[1] === 'window' && args[2]) {
                    const seconds = parseInt(args[2]);
                    if (isNaN(seconds) || seconds < 1) {
                        return message.reply('Fenêtre valide: nombre de secondes');
                    }
                    client.antiraid.antiSpam.timeWindow = seconds * 1000;
                    saveAntiRaidConfig();
                    await message.reply(`Fenêtre de temps mise à jour: ${seconds} secondes`);
                } else if (args[1] === 'action' && args[2]) {
                    if (!['mute', 'kick', 'ban'].includes(args[2])) {
                        return message.reply('Action valide: mute, kick, ban');
                    }
                    client.antiraid.antiSpam.action = args[2];
                    saveAntiRaidConfig();
                    await message.reply(`Action anti-spam mise à jour: ${args[2]}`);
                }
                break;
                
            case 'antiwebhook':
                if (!args[1]) {
                    return message.reply(`Anti-Webhook: ${client.antiraid.antiWebhook.enabled ? 'Activé' : 'Désactivé'} - Action: ${client.antiraid.antiWebhook.action}`);
                }
                
                if (args[1] === 'enable') {
                    client.antiraid.antiWebhook.enabled = true;
                    saveAntiRaidConfig();
                    await message.reply('Anti-Webhook activé.');
                } else if (args[1] === 'disable') {
                    client.antiraid.antiWebhook.enabled = false;
                    saveAntiRaidConfig();
                    await message.reply('Anti-Webhook désactivé.');
                } else if (args[1] === 'action' && args[2]) {
                    if (!['delete', 'warn', 'kick'].includes(args[2])) {
                        return message.reply('Action valide: delete, warn, kick');
                    }
                    client.antiraid.antiWebhook.action = args[2];
                    saveAntiRaidConfig();
                    await message.reply(`Action anti-webhook mise à jour: ${args[2]}`);
                }
                break;
                
            case 'antibot':
                if (!args[1]) {
                    return message.reply(`Anti-Bot: ${client.antiraid.antiBot.enabled ? 'Activé' : 'Désactivé'} - Action: ${client.antiraid.antiBot.action}`);
                }
                
                if (args[1] === 'enable') {
                    client.antiraid.antiBot.enabled = true;
                    saveAntiRaidConfig();
                    await message.reply('Anti-Bot activé.');
                } else if (args[1] === 'disable') {
                    client.antiraid.antiBot.enabled = false;
                    saveAntiRaidConfig();
                    await message.reply('Anti-Bot désactivé.');
                } else if (args[1] === 'action' && args[2]) {
                    if (!['kick', 'ban'].includes(args[2])) {
                        return message.reply('Action valide: kick, ban');
                    }
                    client.antiraid.antiBot.action = args[2];
                    saveAntiRaidConfig();
                    await message.reply(`Action anti-bot mise à jour: ${args[2]}`);
                }
                break;
                
            case 'antimention':
                if (!args[1]) {
                    return message.reply(`Anti-Mass Mention: ${client.antiraid.antiMassMention.enabled ? 'Activé' : 'Désactivé'} - Max: ${client.antiraid.antiMassMention.maxMentions} mentions - Action: ${client.antiraid.antiMassMention.action}`);
                }
                
                if (args[1] === 'enable') {
                    client.antiraid.antiMassMention.enabled = true;
                    saveAntiRaidConfig();
                    await message.reply('Anti-Mass Mention activé.');
                } else if (args[1] === 'disable') {
                    client.antiraid.antiMassMention.enabled = false;
                    saveAntiRaidConfig();
                    await message.reply('Anti-Mass Mention désactivé.');
                } else if (args[1] === 'max' && args[2]) {
                    const max = parseInt(args[2]);
                    if (isNaN(max) || max < 1) {
                        return message.reply('Maximum valide: nombre de mentions');
                    }
                    client.antiraid.antiMassMention.maxMentions = max;
                    saveAntiRaidConfig();
                    await message.reply(`Maximum de mentions mis à jour: ${max}`);
                } else if (args[1] === 'action' && args[2]) {
                    if (!['mute', 'kick', 'ban'].includes(args[2])) {
                        return message.reply('Action valide: mute, kick, ban');
                    }
                    client.antiraid.antiMassMention.action = args[2];
                    saveAntiRaidConfig();
                    await message.reply(`Action anti-mention mise à jour: ${args[2]}`);
                }
                break;
                
            case 'anticaps':
                if (!args[1]) {
                    return message.reply(`Anti-Caps: ${client.antiraid.antiCaps.enabled ? 'Activé' : 'Désactivé'} - Max: ${client.antiraid.antiCaps.maxCaps}% - Action: ${client.antiraid.antiCaps.action}`);
                }
                
                if (args[1] === 'enable') {
                    client.antiraid.antiCaps.enabled = true;
                    saveAntiRaidConfig();
                    await message.reply('Anti-Caps activé.');
                } else if (args[1] === 'disable') {
                    client.antiraid.antiCaps.enabled = false;
                    saveAntiRaidConfig();
                    await message.reply('Anti-Caps désactivé.');
                } else if (args[1] === 'max' && args[2]) {
                    const max = parseInt(args[2]);
                    if (isNaN(max) || max < 1 || max > 100) {
                        return message.reply('Maximum valide: pourcentage entre 1 et 100');
                    }
                    client.antiraid.antiCaps.maxCaps = max;
                    saveAntiRaidConfig();
                    await message.reply(`Maximum de majuscules mis à jour: ${max}%`);
                } else if (args[1] === 'action' && args[2]) {
                    if (!['delete', 'warn', 'mute'].includes(args[2])) {
                        return message.reply('Action valide: delete, warn, mute');
                    }
                    client.antiraid.antiCaps.action = args[2];
                    saveAntiRaidConfig();
                    await message.reply(`Action anti-caps mise à jour: ${args[2]}`);
                }
                break;
                
            case 'antiinvite':
                if (!args[1]) {
                    return message.reply(`Anti-Invite: ${client.antiraid.antiInvite.enabled ? 'Activé' : 'Désactivé'} - Action: ${client.antiraid.antiInvite.action}`);
                }
                
                if (args[1] === 'enable') {
                    client.antiraid.antiInvite.enabled = true;
                    saveAntiRaidConfig();
                    await message.reply('Anti-Invite activé.');
                } else if (args[1] === 'disable') {
                    client.antiraid.antiInvite.enabled = false;
                    saveAntiRaidConfig();
                    await message.reply('Anti-Invite désactivé.');
                } else if (args[1] === 'action' && args[2]) {
                    if (!['delete', 'warn', 'kick'].includes(args[2])) {
                        return message.reply('Action valide: delete, warn, kick');
                    }
                    client.antiraid.antiInvite.action = args[2];
                    saveAntiRaidConfig();
                    await message.reply(`Action anti-invite mise à jour: ${args[2]}`);
                }
                break;
                
            case 'logs':
                const targetChannel = message.mentions.channels.first();
                if (!targetChannel) {
                    const currentLogs = client.config?.[message.guild.id]?.modLogs;
                    if (currentLogs) {
                        const channel = message.guild.channels.cache.get(currentLogs);
                        return message.reply(`Logs anti-raid actuellement configurés dans: ${channel ? channel.toString() : 'Salon introuvable'}`);
                    } else {
                        return message.reply('Aucun salon de logs anti-raid configuré. Usage: `+antiraid logs #salon`');
                    }
                }
                
                // Initialiser la config si nécessaire
                client.config = client.config || {};
                client.config[message.guild.id] = client.config[message.guild.id] || {};
                
                // Configurer le salon de logs anti-raid
                client.config[message.guild.id].modLogs = targetChannel.id;
                
                await message.reply(`Logs anti-raid configurés dans: ${targetChannel}`);
                break;
                
            case 'whitelist':
                if (!args[1]) {
                    const whitelist = client.antiraid.globalWhitelist.map(id => `<@${id}>`).join(', ') || 'Aucun';
                    return message.reply(`Whitelist globale: ${whitelist}`);
                }
                
                const action = args[1].toLowerCase();
                if (action === 'add') {
                    const target = message.mentions.users.first();
                    if (!target) return message.reply('Mentionne un utilisateur à ajouter.');
                    if (client.antiraid.globalWhitelist.includes(target.id)) return message.reply('Déjà whitelisté.');
                    
                    client.antiraid.globalWhitelist.push(target.id);
                    saveAntiRaidConfig();
                    await message.reply(`${target.tag} ajouté à la whitelist globale anti-raid.`);
                } else if (action === 'remove') {
                    const target = message.mentions.users.first();
                    if (!target) return message.reply('Mentionne un utilisateur à retirer.');
                    if (!client.antiraid.globalWhitelist.includes(target.id)) return message.reply('Pas dans la whitelist.');
                    
                    client.antiraid.globalWhitelist = client.antiraid.globalWhitelist.filter(id => id !== target.id);
                    saveAntiRaidConfig();
                    await message.reply(`${target.tag} retiré de la whitelist globale anti-raid.`);
                }
                break;
                
            default:
                await message.reply(`**Usage:** \`${client.getPrefix(message.guild.id)}antiraid\`\n\n**Sous-commandes:**\n• \`enable/disable\` - Activer/désactiver\n• \`logs #salon\` - Configurer le salon de logs anti-raid\n• \`antilink [enable/disable/action]\` - Anti-liens\n• \`antispam [enable/disable/max/window/action]\` - Anti-spam\n• \`antitoken [enable/disable/age/action]\` - Anti-comptes recents\n• \`antiwebhook [enable/disable/action]\` - Anti-webhooks\n• \`antibot [enable/disable/action]\` - Anti-bots\n• \`antimention [enable/disable/max/action]\` - Anti-mentions massives\n• \`anticaps [enable/disable/max/action]\` - Anti-majuscules\n• \`antiinvite [enable/disable/action]\` - Anti-invitations\n• \`antiban [enable/disable/max/window]\` - Anti-bans massifs\n• \`whitelist [add/remove] @user\` - Whitelist globale`);
        }
    }
};
