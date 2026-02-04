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
                return JSON.parse(fs.readFileSync(filePath, 'utf8'));
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
        
        // Sauvegarder les messages de bienvenue
        if (client.welcomeMessages) {
            const welcomeData = {};
            for (const [guildId, welcomeConfig] of client.welcomeMessages) {
                welcomeData[guildId] = welcomeConfig;
            }
            this.saveData('welcomeMessages', welcomeData);
        }
        
        // Sauvegarder les tickets
        if (client.tickets) {
            const ticketData = {};
            for (const [guildId, ticketConfig] of client.tickets) {
                ticketData[guildId] = ticketConfig;
            }
            this.saveData('tickets', ticketData);
        }
        
        // Sauvegarder les configurations de boost
        if (client.boostConfig) {
            const boostData = {};
            for (const [guildId, boostConfig] of client.boostConfig) {
                boostData[guildId] = boostConfig;
            }
            this.saveData('boostConfig', boostData);
        }
        
        // Sauvegarder les owners par serveur
        if (client.serverOwners) {
            const serverOwnersData = {};
            for (const [guildId, owners] of client.serverOwners) {
                serverOwnersData[guildId] = owners;
            }
            this.saveData('serverOwners', serverOwnersData);
        }
        
        // Sauvegarder les permissions par serveur
        if (client.permissions) {
            const permissionsData = {};
            for (const [guildId, perms] of client.permissions) {
                permissionsData[guildId] = perms;
            }
            this.saveData('permissions', permissionsData);
        }
        
        // Sauvegarder les permissions de commandes par serveur
        if (client.serverPermLevels) {
            const serverPermLevelsData = {};
            for (const [guildId, perms] of client.serverPermLevels) {
                serverPermLevelsData[guildId] = perms;
            }
            this.saveData('serverPermLevels', serverPermLevelsData);
        }
        
        // Sauvegarder les tickets actifs
        if (client.ticketData) {
            const ticketDataActive = {};
            for (const [guildId, tickets] of client.ticketData) {
                ticketDataActive[guildId] = tickets;
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
        
        // Charger les messages de bienvenue
        const welcomeData = this.loadData('welcomeMessages', {});
        client.welcomeMessages = new Map();
        for (const [guildId, welcomeConfig] of Object.entries(welcomeData)) {
            client.welcomeMessages.set(guildId, welcomeConfig);
        }
        
        // Charger les tickets
        const ticketData = this.loadData('tickets', {});
        client.tickets = new Map();
        for (const [guildId, ticketConfig] of Object.entries(ticketData)) {
            client.tickets.set(guildId, ticketConfig);
        }
        
        // Charger les configurations de boost
        const boostData = this.loadData('boostConfig', {});
        // client.boostConfig = new Map(); // Déjà initialisé dans index.js
        for (const [guildId, boostConfig] of Object.entries(boostData)) {
            client.boostConfig.set(guildId, boostConfig);
        }
        
        client.ticketData = new Map(); // Sera chargé après
        
        // Charger les tickets actifs par serveur
        const ticketDataActive = this.loadData('ticketDataActive', {});
        client.ticketData = new Map();
        for (const [guildId, tickets] of Object.entries(ticketDataActive)) {
            client.ticketData.set(guildId, tickets);
        }
        
        // Charger les owners par serveur
        const serverOwnersData = this.loadData('serverOwners', {});
        client.serverOwners = new Map();
        for (const [guildId, owners] of Object.entries(serverOwnersData)) {
            client.serverOwners.set(guildId, owners);
        }
        
        // Charger les permissions par serveur
        const permissionsData = this.loadData('permissions', {});
        client.permissions = new Map();
        for (const [guildId, perms] of Object.entries(permissionsData)) {
            client.permissions.set(guildId, perms);
        }
        
        // Charger les permissions de commandes par serveur
        const serverPermLevelsData = this.loadData('serverPermLevels', {});
        client.serverPermLevels = new Map();
        for (const [guildId, perms] of Object.entries(serverPermLevelsData)) {
            client.serverPermLevels.set(guildId, perms);
        }
    }
}

module.exports = DataSaver;
