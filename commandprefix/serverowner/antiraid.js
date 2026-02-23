const { PermissionsBitField, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'antiraid',
    description: 'Configure le système anti-raid',
    permissions: PermissionsBitField.Flags.Administrator,
    async execute(message, args, client) {
        const prefix = client.getPrefix(message.guild.id);
        
        // Vérifier si l'utilisateur est un owner
        if (!client.isOwner(message.author.id, message.guild.id)) {
            return message.reply('Commande réservée aux owners du bot.');
        }
        
        // Vérifier les permissions Discord (Administrateur requis)
        if (!message.member.permissions.has('Administrator')) {
            return message.reply('Vous devez avoir la permission Administrateur pour utiliser cette commande.');
        }
        
        const guildId = message.guild.id;
        
        // Initialiser la configuration anti-raid pour ce serveur si elle n'existe pas
        if (!client.serverAntiraid) {
            client.serverAntiraid = new Map();
        }
        
        if (!client.serverAntiraid.has(guildId)) {
            client.serverAntiraid.set(guildId, {
                enabled: true, // État global du système anti-raid
                // Modules activés par défaut quand le bot démarre
                antiban: { enabled: true },
                antiwebhook: { enabled: true },
                antilink: { enabled: true },
                
                // Modules désactivés par défaut (à activer manuellement)
                antispam: { enabled: false },
                antitoken: { enabled: false },
                antibot: { enabled: false },
                antimassmention: { enabled: false },
                anticaps: { enabled: false },
                antiinvite: { enabled: false }
            });
        } else {
            // Migration: ajouter la propriété 'enabled' si elle n'existe pas (pour les anciennes configurations)
            const config = client.serverAntiraid.get(guildId);
            if (config.enabled === undefined) {
                config.enabled = true;
            }
            
            // Migration: s'assurer que tous les modules existent avec la propriété enabled
            const defaultModules = {
                antiban: { enabled: true },
                antiwebhook: { enabled: true },
                antilink: { enabled: true },
                antispam: { enabled: false },
                antitoken: { enabled: false },
                antibot: { enabled: false },
                antimassmention: { enabled: false },
                anticaps: { enabled: false },
                antiinvite: { enabled: false }
            };
            
            for (const [moduleName, defaultConfig] of Object.entries(defaultModules)) {
                if (!config[moduleName]) {
                    config[moduleName] = defaultConfig;
                } else if (config[moduleName].enabled === undefined) {
                    config[moduleName].enabled = defaultConfig.enabled;
                }
            }
            
            client.saveData();
        }
        
        const subcommand = args[0]?.toLowerCase();
        const config = client.serverAntiraid.get(guildId);
        
        // Gérer les commandes globales enable/disable
        if (subcommand === 'enable') {
            config.enabled = true;
            await message.reply('Système anti-raid activé pour ce serveur.');
            client.saveData();
            return;
        }
        
        if (subcommand === 'disable') {
            config.enabled = false;
            await message.reply('Système anti-raid désactivé pour ce serveur.');
            client.saveData();
            return;
        }
        
        if (!subcommand) {
            // Afficher le statut actuel
            const embed = new EmbedBuilder()
                .setTitle(`Anti-Raid - ${message.guild.name}`)
                .setColor('FFFFFF')
                .setThumbnail(message.guild.iconURL({ dynamic: true, size: 512 }))
                .setTimestamp()
                .addFields(
                    { 
                        name: 'Modules activés', 
                        value: 
                            '• `antiban` - Anti-bans massifs\n' +
                            '• `antiwebhook` - Anti-webhooks\n' +
                            '• `antilink` - Anti-liens\n' +
                            (config.antispam.enabled ? '• `antispam` - Anti-spam\n' : '') +
                            (config.antitoken.enabled ? '• `antitoken` - Anti-comptes récents\n' : '') +
                            (config.antibot.enabled ? '• `antibot` - Anti-bots\n' : '') +
                            (config.antimassmention.enabled ? '• `antimassmention` - Anti-mentions massives\n' : '') +
                            (config.anticaps.enabled ? '• `anticaps` - Anti-majuscules\n' : '') +
                            (config.antiinvite.enabled ? '• `antiinvite` - Anti-invitations\n' : ''),
                        inline: false 
                    },
                    { 
                        name: 'Modules désactivés', 
                        value: 
                            (!config.antispam.enabled ? '• `antispam` - Anti-spam\n' : '') +
                            (!config.antitoken.enabled ? '• `antitoken` - Anti-comptes récents\n' : '') +
                            (!config.antibot.enabled ? '• `antibot` - Anti-bots\n' : '') +
                            (!config.antimassmention.enabled ? '• `antimassmention` - Anti-mentions massives\n' : '') +
                            (!config.anticaps.enabled ? '• `anticaps` - Anti-majuscules\n' : '') +
                            (!config.antiinvite.enabled ? '• `antiinvite` - Anti-invitations\n' : ''),
                        inline: false 
                    }
                )
                .setFooter({ text: 'Utilise: !antiraid [module] [on/off]' });
            
            return message.reply({ embeds: [embed] });
        }
        
        const module = args[0]?.toLowerCase();
        const action = args[1]?.toLowerCase();
        
        // Vérifier si le module existe
        if (!config.hasOwnProperty(module)) {
            return message.reply('Module invalide. Modules disponibles: antiban, antiwebhook, antilink, antispam, antitoken, antibot, antimassmention, anticaps, antiinvite');
        }
        
        // Vérifier si l'action est valide
        if (action !== 'on' && action !== 'off') {
            return message.reply(`Action invalide. Utilise: ${prefix}antiraid ${module} [on/off]`);
        }
        
        // Activer/désactiver le module
        config[module].enabled = action === 'on';
        
        const moduleName = module.replace('anti', '').replace('link', 'lien').replace('ban', 'ban').replace('webhook', 'webhook');
        const status = action === 'on' ? 'activé' : 'désactivé';
        
        await message.reply(`Module anti-${moduleName} ${status} !`);
        
        // Sauvegarder automatiquement
        client.saveData();
    }
};
