const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'logs',
    description: 'Crée automatiquement la catégorie et tous les salons de logs',
    permissions: PermissionsBitField.Flags.Administrator,
    async execute(message, args, client) {
        const guild = message.guild;
        
        client.config = client.config || {};
        client.config[guild.id] = client.config[guild.id] || {};
        
        try {
            // Vérifier si la catégorie existe déjà
            let logsCategory = guild.channels.cache.find(c => c.name === 'Logs' && c.type === 4);
            
            if (!logsCategory) {
                // Créer la catégorie Logs
                logsCategory = await guild.channels.create({
                    name: 'Logs',
                    type: 4, // Category
                    position: 0,
                    permissionOverwrites: [
                        {
                            id: guild.id,
                            deny: ['ViewChannel', 'SendMessages', 'ReadMessageHistory']
                        },
                        {
                            id: client.user.id,
                            allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory']
                        }
                    ]
                });
            }
            
            // Créer les salons de logs
            const logChannels = {};
            
            // Logs Modération
            if (!guild.channels.cache.find(c => c.name === 'logs-modération' && c.parentId === logsCategory.id)) {
                const modChannel = await guild.channels.create({
                    name: 'logs-modération',
                    type: 0, // Text channel
                    parent: logsCategory.id,
                    permissionOverwrites: [
                        {
                            id: guild.id,
                            deny: ['ViewChannel', 'SendMessages', 'ReadMessageHistory']
                        },
                        {
                            id: client.user.id,
                            allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory']
                        }
                    ]
                });
                logChannels.modLogs = modChannel.id;
            }
            
            // Logs Vocaux
            if (!guild.channels.cache.find(c => c.name === 'logs-vocaux' && c.parentId === logsCategory.id)) {
                const vocalChannel = await guild.channels.create({
                    name: 'logs-vocaux',
                    type: 0,
                    parent: logsCategory.id,
                    permissionOverwrites: [
                        {
                            id: guild.id,
                            deny: ['ViewChannel', 'SendMessages', 'ReadMessageHistory']
                        },
                        {
                            id: client.user.id,
                            allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory']
                        }
                    ]
                });
                logChannels.vocalLogs = vocalChannel.id;
            }
            
            // Logs Rôles
            if (!guild.channels.cache.find(c => c.name === 'logs-rôles' && c.parentId === logsCategory.id)) {
                const roleChannel = await guild.channels.create({
                    name: 'logs-rôles',
                    type: 0,
                    parent: logsCategory.id,
                    permissionOverwrites: [
                        {
                            id: guild.id,
                            deny: ['ViewChannel', 'SendMessages', 'ReadMessageHistory']
                        },
                        {
                            id: client.user.id,
                            allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory']
                        }
                    ]
                });
                logChannels.roleLogs = roleChannel.id;
            }
            
            // Logs Chat
            if (!guild.channels.cache.find(c => c.name === 'logs-chat' && c.parentId === logsCategory.id)) {
                const chatChannel = await guild.channels.create({
                    name: 'logs-chat',
                    type: 0,
                    parent: logsCategory.id,
                    permissionOverwrites: [
                        {
                            id: guild.id,
                            deny: ['ViewChannel', 'SendMessages', 'ReadMessageHistory']
                        },
                        {
                            id: client.user.id,
                            allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory']
                        }
                    ]
                });
                logChannels.chatLogs = chatChannel.id;
            }
            
            // Configurer tous les logs
            client.config[guild.id] = {
                ...client.config[guild.id],
                ...logChannels
            };
            
            message.reply('Catégorie "Logs" et tous les salons créés avec succès !');
            
            // Envoyer les logs
            await client.sendCommandLog(message.guild, { name: 'logs', description: this.description }, message.author, ['Catégorie et salons créés']);
            
        } catch (error) {
            console.error(error);
            message.reply('Erreur lors de la création des salons de logs.');
        }
    }
};
