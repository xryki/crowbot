const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'antiraid',
    description: 'Configure le système anti-raid (anti-link, anti-token, anti-ban)',
    permissions: PermissionsBitField.Flags.Administrator,
    async execute(message, args, client) {
        // Initialiser les données anti-raid si elles n'existent pas
        if (!client.antiraid) {
            client.antiraid = {
                enabled: false,
                antiLink: {
                    enabled: true,
                    action: 'delete', // delete, warn, kick
                    whitelist: []
                },
                antiToken: {
                    enabled: true,
                    maxAccountAge: 7 * 24 * 60 * 60 * 1000, // 7 jours en ms
                    action: 'kick', // kick, ban
                    whitelist: []
                },
                antiBan: {
                    enabled: true,
                    maxBans: 3, // Nombre de bans en X secondes
                    timeWindow: 10000, // 10 secondes
                    action: 'lockdown', // lockdown, notify
                    whitelist: [] // Modérateurs autorisés
                },
                globalWhitelist: [] // Whitelist globale pour toutes les protections
            };
        }
        
        const guildId = message.guild.id;
        
        if (!args[0]) {
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
                        name: 'Anti-Token', 
                        value: `${client.antiraid.antiToken.enabled ? 'Activé' : 'Désactivé'} - Action: ${client.antiraid.antiToken.action}`, 
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
        
        const subcommand = args[0].toLowerCase();
        
        switch (subcommand) {
            case 'enable':
            case 'on':
                client.antiraid.enabled = true;
                await message.reply('Système anti-raid activé.');
                break;
                
            case 'disable':
            case 'off':
                client.antiraid.enabled = false;
                await message.reply('Système anti-raid désactivé.');
                break;
                
            case 'antilink':
                if (!args[1]) {
                    return message.reply(`Anti-Link: ${client.antiraid.antiLink.enabled ? 'Activé' : 'Désactivé'} - Action: ${client.antiraid.antiLink.action}`);
                }
                
                if (args[1] === 'enable') {
                    client.antiraid.antiLink.enabled = true;
                    await message.reply('Anti-Link activé.');
                } else if (args[1] === 'disable') {
                    client.antiraid.antiLink.enabled = false;
                    await message.reply('Anti-Link désactivé.');
                } else if (args[1] === 'action' && args[2]) {
                    if (!['delete', 'warn', 'kick'].includes(args[2])) {
                        return message.reply('Action valide: delete, warn, kick');
                    }
                    client.antiraid.antiLink.action = args[2];
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
                    await message.reply('Anti-Token activé.');
                } else if (args[1] === 'disable') {
                    client.antiraid.antiToken.enabled = false;
                    await message.reply('Anti-Token désactivé.');
                } else if (args[1] === 'age' && args[2]) {
                    const days = parseInt(args[2]);
                    if (isNaN(days) || days < 1) {
                        return message.reply('Âge valide: nombre de jours minimum');
                    }
                    client.antiraid.antiToken.maxAccountAge = days * 24 * 60 * 60 * 1000;
                    await message.reply(`Âge minimum des comptes mis à jour: ${days} jours`);
                } else if (args[1] === 'action' && args[2]) {
                    if (!['kick', 'ban'].includes(args[2])) {
                        return message.reply('Action valide: kick, ban');
                    }
                    client.antiraid.antiToken.action = args[2];
                    await message.reply(`Action anti-token mise à jour: ${args[2]}`);
                }
                break;
                
            case 'antiban':
                if (!args[1]) {
                    return message.reply(`Anti-Ban: ${client.antiraid.antiBan.enabled ? 'Activé' : 'Désactivé'} - Max: ${client.antiraid.antiBan.maxBans} bans en ${client.antiraid.antiBan.timeWindow/1000}s`);
                }
                
                if (args[1] === 'enable') {
                    client.antiraid.antiBan.enabled = true;
                    await message.reply('Anti-Ban massif activé.');
                } else if (args[1] === 'disable') {
                    client.antiraid.antiBan.enabled = false;
                    await message.reply('Anti-Ban massif désactivé.');
                } else if (args[1] === 'max' && args[2]) {
                    const max = parseInt(args[2]);
                    if (isNaN(max) || max < 1) {
                        return message.reply('Maximum valide: nombre de bans');
                    }
                    client.antiraid.antiBan.maxBans = max;
                    await message.reply(`Maximum de bans mis à jour: ${max}`);
                } else if (args[1] === 'window' && args[2]) {
                    const seconds = parseInt(args[2]);
                    if (isNaN(seconds) || seconds < 1) {
                        return message.reply('Fenêtre valide: nombre de secondes');
                    }
                    client.antiraid.antiBan.timeWindow = seconds * 1000;
                    await message.reply(`Fenêtre de temps mise à jour: ${seconds} secondes`);
                }
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
                    await message.reply(`${target.tag} ajouté à la whitelist globale anti-raid.`);
                } else if (action === 'remove') {
                    const target = message.mentions.users.first();
                    if (!target) return message.reply('Mentionne un utilisateur à retirer.');
                    if (!client.antiraid.globalWhitelist.includes(target.id)) return message.reply('Pas dans la whitelist.');
                    
                    client.antiraid.globalWhitelist = client.antiraid.globalWhitelist.filter(id => id !== target.id);
                    await message.reply(`${target.tag} retiré de la whitelist globale anti-raid.`);
                }
                break;
                
            default:
                await message.reply(`Usage: ${client.getPrefix(message.guild.id)}antiraid [enable|disable|antilink|antitoken|antiban|whitelist]`);
        }
    }
};
