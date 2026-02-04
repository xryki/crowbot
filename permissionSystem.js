const { PermissionsBitField } = require('discord.js');

class PermissionSystem {
    constructor(client) {
        this.client = client;
        
        // Initialiser le système de permissions
        this.client.permissions = new Map(); // guildId -> { roleId: permLevel }
        this.client.permLevels = new Map(); // permLevel -> [commandNames]
        
        // Définir les niveaux de permissions (1-6)
        this.setupPermissionLevels();
        
        // Charger les permissions existantes
        this.loadPermissions();
    }
    
    setupPermissionLevels() {
        // Définir quelles commandes sont accessibles à chaque niveau
        const permConfig = {
            1: [ // Perm 1 - Utilisateurs basiques
                'help', 'botinfo', 'server', 
                '8ball', 'coinflip', 'gw'
            ],
            2: [ // Perm 2 - Utilisateurs avancés
                'create', 'rename', 'close'
            ],
            3: [ // Perm 3 - Modérateurs débutants
                'clear', 'slowmode', 'lock', 'unlock', 'mute', 'unmute',
                'nick', 'lockname', 'unlockname', 'cmute', 'cunmute'
            ],
            4: [ // Perm 4 - Modérateurs avancés
                'kick', 'ban', 'unban', 'addrole', 'delrole', 'derank',
                'renew', 'say', 'unmuteall'
            ],
            5: [ // Perm 5 - Administrateurs
                'autorole', 'setup', 'bl', 'unbl', 'bls', 'wl', 'unwl', 'logs',
                'antiraid', 'welcome', 'ticket', 'massrole',
                'serverpic', 'serverbanner', 'botpic', 'botbanner'
            ],
            6: [ // Perm 6 - Administrateurs avancés
                'setperm', 'delperm', 'perms', 'editperm', 'resetserverperms'
            ],
            7: [ // Perm 7 - Super Owners
                'eval', 'owner', 'owners', 'restart', 'boostmsg', 'helpall',
                'prefix', 'unbanall', 'resetperms', 'myperms' // Commandes avancées de gestion
            ],
            8: [ // Perm 8 - Co-Owners
                // Réservé pour futures commandes de co-gestion
            ],
            9: [ // Perm 9 - Principal Owner
                // Commandes ultimes et gestion complète
            ]
        };
        
        // Configurer les niveaux de permissions
        Object.entries(permConfig).forEach(([level, commands]) => {
            this.client.permLevels.set(parseInt(level), commands);
        });
    }
    
    loadPermissions() {
        // Charger depuis dataSaver si disponible
        if (this.client.dataSaver) {
            const savedPerms = this.client.dataSaver.loadData('permissions');
            if (savedPerms) {
                this.client.permissions = new Map(Object.entries(savedPerms));
            }
        }
    }
    
    savePermissions() {
        // Sauvegarder via dataSaver
        if (this.client.dataSaver) {
            const permsObj = Object.fromEntries(this.client.permissions);
            this.client.dataSaver.saveData('permissions', permsObj);
        }
    }
    
    // Obtenir le niveau de permission d'un utilisateur
    getUserPermissionLevel(guildId, userId) {
        const guild = this.client.guilds.cache.get(guildId);
        if (!guild) return 0;
        
        const member = guild.members.cache.get(userId);
        if (!member) return 0;
        
        // Vérifier si c'est un owner du bot - accès complet à tout
        if (this.client.isOwner(userId, guildId)) {
            return 999; // Niveau spécial pour owners = accès à tout
        }
        
        // Vérifier les permissions personnalisées d'abord (priorité absolue)
        const guildPerms = this.client.permissions.get(guildId);
        if (guildPerms) {
            let highestPerm = 0;
            member.roles.cache.forEach(role => {
                const rolePerm = guildPerms[role.id];
                if (rolePerm && rolePerm > highestPerm) {
                    highestPerm = rolePerm;
                }
            });
            if (highestPerm > 0) {
                return highestPerm; // Retourner direct la permission perso, ignorer les perms Discord
            }
        }
        
        // Si aucune permission perso, vérifier les permissions Discord
        if (member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return 5;
        }
        
        return 0;
    }
    
    /**
     * Vérifie si un utilisateur peut utiliser une commande
     * @param {string} guildId - ID du serveur
     * @param {string} userId - ID de l'utilisateur
     * @param {string} commandName - Nom de la commande
     * @returns {boolean} - true si l'utilisateur peut utiliser la commande
     */
    canUseCommand(guildId, userId, commandName) {
        // Les owners peuvent utiliser toutes les commandes
        if (this.client.isOwner(userId, guildId)) {
            return true;
        }
        
        // Commandes publiques accessibles à tout le monde
        const publicCommands = ['snipe', 'pic', 'user', 'banner', 'profile', 'ping'];
        if (publicCommands.includes(commandName)) {
            return true;
        }
        
        // Obtenir le niveau de permission de l'utilisateur
        const userLevel = this.getUserPermissionLevel(guildId, userId);
        
        // Si l'utilisateur n'a aucun niveau de permission, il ne peut rien utiliser
        if (userLevel === 0) {
            return false;
        }
        
        // Vérifier les permissions de serveur personnalisées d'abord
        if (this.client.serverPermLevels && this.client.serverPermLevels.has(guildId)) {
            const serverPerms = this.client.serverPermLevels.get(guildId);
            for (let level = 1; level <= 9; level++) {
                const commands = serverPerms[level];
                if (commands && commands.includes(commandName) && userLevel >= level) {
                    return true;
                }
            }
        }
        
        // Sinon, vérifier les permissions globales
        for (let level = 1; level <= 9; level++) {
            const commands = this.client.permLevels.get(level);
            if (commands && commands.includes(commandName) && userLevel >= level) {
                return true;
            }
        }
        
        return false;
    }
    
    // Assigner un rôle à un niveau de permission
    assignRoleToPermission(guildId, roleId, permLevel) {
        if (!this.client.permissions.has(guildId)) {
            this.client.permissions.set(guildId, {});
        }
        
        const guildPerms = this.client.permissions.get(guildId);
        guildPerms[roleId] = permLevel;
        
        this.savePermissions();
        return true;
    }
    
    // Retirer la permission d'un rôle
    removeRolePermission(guildId, roleId) {
        const guildPerms = this.client.permissions.get(guildId);
        if (guildPerms && guildPerms[roleId]) {
            delete guildPerms[roleId];
            this.savePermissions();
            return true;
        }
        return false;
    }
    
    // Obtenir les commandes disponibles pour un niveau de permission
    getCommandsForLevel(level) {
        const commands = [];
        
        for (let i = 1; i <= level; i++) {
            const levelCommands = this.client.permLevels.get(i);
            if (levelCommands) {
                commands.push(...levelCommands);
            }
        }
        
        return [...new Set(commands)]; // Éliminer les doublons
    }
    
    // Obtenir la configuration des permissions d'un serveur
    getGuildPermissions(guildId) {
        return this.client.permissions.get(guildId) || {};
    }
    
    // Formatter les informations de permissions pour l'affichage
    formatPermissionInfo(guildId) {
        const guildPerms = this.getGuildPermissions(guildId);
        const guild = this.client.guilds.cache.get(guildId);
        
        if (!guild) return "Serveur introuvable";
        
        let info = `**Configuration des permissions pour ${guild.name}**\n\n`;
        
        Object.entries(guildPerms).forEach(([roleId, permLevel]) => {
            const role = guild.roles.cache.get(roleId);
            const roleName = role ? role.name : 'Rôle supprimé';
            info += `- **${roleName}** → Perm ${permLevel}\n`;
        });
        
        if (Object.keys(guildPerms).length === 0) {
            info += "Aucune permission configurée. Utilisez `!setperm <@role> <niveau>` pour commencer.";
        }
        
        return info;
    }
}

module.exports = PermissionSystem;
