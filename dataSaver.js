const fs = require('fs');

// Système de sauvegarde des données
class DataSaver {
    constructor() {
        this.dataPath = './data';
        this.ensureDataFolder();
    }
    
    ensureDataFolder() {
        if (!fs.existsSync(this.dataPath)) {
            fs.mkdirSync(this.dataPath);
        }
    }
    
    saveData(filename, data) {
        try {
            fs.writeFileSync(`${this.dataPath}/${filename}.json`, JSON.stringify(data, null, 2));
        } catch (error) {
            console.error(`Erreur sauvegarde ${filename}:`, error);
        }
    }
    
    loadData(filename, defaultValue = {}) {
        try {
            const filePath = `${this.dataPath}/${filename}.json`;
            if (fs.existsSync(filePath)) {
                return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            }
        } catch (error) {
            console.error(`Erreur chargement ${filename}:`, error);
        }
        return defaultValue;
    }
    
    // Sauvegarder toutes les données du bot
    saveAllData(client) {
        this.saveData('blacklist', client.blacklist || []);
        this.saveData('whitelist', client.whitelist || []);
        this.saveData('prefixes', client.prefixes || {});
        this.saveData('config', client.config || {});
        this.saveData('owners', client.owners || []);
        
        // Sauvegarder la configuration anti-raid (global)
        if (client.antiraid) {
            this.saveData('antiraid', client.antiraid);
        }
        
        // Sauvegarder la configuration anti-raid par serveur
        if (client.serverAntiraid && client.serverAntiraid instanceof Map) {
            const serverAntiraidData = {};
            for (const [guildId, antiraidConfig] of client.serverAntiraid) {
                serverAntiraidData[guildId] = antiraidConfig;
            }
            this.saveData('serverAntiraid', serverAntiraidData);
        }
        
        // Sauvegarder les messages de bienvenue
        if (client.welcomeMessages && client.welcomeMessages instanceof Map) {
            const welcomeData = {};
            for (const [guildId, welcomeConfig] of client.welcomeMessages) {
                welcomeData[guildId] = welcomeConfig;
            }
            this.saveData('welcomeMessages', welcomeData);
        }
        
        // Sauvegarder les tickets
        if (client.tickets && client.tickets instanceof Map) {
            const ticketsData = {};
            for (const [guildId, ticketConfig] of client.tickets) {
                ticketsData[guildId] = ticketConfig;
            }
            this.saveData('tickets', ticketsData);
        }
        
        // Sauvegarder la configuration boost
        if (client.boostConfig && client.boostConfig instanceof Map) {
            const boostData = {};
            for (const [guildId, boostConfig] of client.boostConfig) {
                boostData[guildId] = boostConfig;
            }
            this.saveData('boostConfig', boostData);
        }
        
        // Sauvegarder les owners par serveur
        if (client.serverOwners && client.serverOwners instanceof Map) {
            const serverOwnersData = {};
            for (const [guildId, owners] of client.serverOwners) {
                serverOwnersData[guildId] = owners;
            }
            this.saveData('serverOwners', serverOwnersData);
        }
        
        // Sauvegarder la configuration ghost ping
        if (client.ghostPingConfig) {
            this.saveData('ghostPingConfig', client.ghostPingConfig);
        }
        
        // Sauvegarder la configuration autorole
        if (client.autorole) {
            this.saveData('autorole', client.autorole);
        }
        
        // Sauvegarder les pseudos lockés
        if (client.lockedNames) {
            const lockedNamesData = {};
            for (const [userId, lockData] of client.lockedNames) {
                lockedNamesData[userId] = lockData;
            }
            this.saveData('lockedNames', lockedNamesData);
        }
        
        // Sauvegarder les tickets actifs
        if (client.ticketData) {
            const ticketDataActive = {};
            for (const [channelId, ticketInfo] of client.ticketData) {
                ticketDataActive[channelId] = ticketInfo;
            }
            this.saveData('ticketDataActive', ticketDataActive);
        }
        
        // Les snipes ne sont pas sauvegardés (volatiles par nature)
    }
    
    // Charger toutes les données du bot
    loadAllData(client) {
        client.blacklist = this.loadData('blacklist', []);
        client.whitelist = this.loadData('whitelist', []);
        client.prefixes = this.loadData('prefixes', {});
        client.config = this.loadData('config', {});
        client.owners = this.loadData('owners', []);
        client.snipes = new Map(); // Reset les snipes au démarrage
        
        // Charger la configuration anti-raid (global)
        client.antiraid = this.loadData('antiraid', {
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
                maxAccountAge: 604800000,        // 7 jours en ms
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
                maxBans: 5, // Nombre de bans en X secondes
                timeWindow: 10000, // 10 secondes
                action: 'lockdown', // lockdown, notify
                whitelist: [] // Modérateurs autorisés
            },
            globalWhitelist: [], // Whitelist globale pour toutes les protections
            logChannel: null // Salon pour les logs anti-raid
        });
        
        // Charger la configuration anti-raid par serveur
        const serverAntiraidData = this.loadData('serverAntiraid', {});
        client.serverAntiraid = new Map(Object.entries(serverAntiraidData));
        
        // Charger les messages de bienvenue
        const welcomeMessagesData = this.loadData('welcomeMessages', {});
        client.welcomeMessages = new Map(Object.entries(welcomeMessagesData));
        
        // Charger les tickets
        const ticketsData = this.loadData('tickets', {});
        client.tickets = new Map(Object.entries(ticketsData));
        
        // Charger la configuration boost
        const boostConfigData = this.loadData('boostConfig', {});
        client.boostConfig = new Map(Object.entries(boostConfigData));
        
        // Charger les owners par serveur
        const serverOwnersData = this.loadData('serverOwners', {});
        client.serverOwners = new Map(Object.entries(serverOwnersData));
        
        // Charger la configuration ghost ping
        client.ghostPingConfig = this.loadData('ghostPingConfig', {});
        
        // Charger la configuration autorole
        client.autorole = this.loadData('autorole', {});
        
        // Charger les pseudos lockés
        const lockedNamesData = this.loadData('lockedNames', {});
        client.lockedNames = new Map();
        for (const [userId, lockData] of Object.entries(lockedNamesData)) {
            client.lockedNames.set(userId, lockData);
        }
        
        // Charger les tickets actifs
        const ticketDataActive = this.loadData('ticketDataActive', {});
        client.ticketData = new Map();
        for (const [channelId, ticketInfo] of Object.entries(ticketDataActive)) {
            client.ticketData.set(channelId, ticketInfo);
        }
    }
}

module.exports = new DataSaver();
