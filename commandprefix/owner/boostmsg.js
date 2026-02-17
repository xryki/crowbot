const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'boostmsg',
    description: 'Configure le message de remerciement pour les boosts',
    async execute(message, args, client) {
        // Vérifier si c'est un owner
        if (!client.isOwner(message.author.id, message.guild.id)) {
            return message.reply('Seul les owners du bot peuvent utiliser cette commande.');
        }
        
        const guild = message.guild;
        
        // Initialiser la configuration des boosts si elle n'existe pas
        if (!client.boostConfig) {
            client.boostConfig = new Map();
        }
        
        const subcommand = args[0]?.toLowerCase();
        
        if (!subcommand) {
            // Afficher la configuration actuelle
            const config = client.boostConfig.get(guild.id);
            
            if (!config) {
                return message.reply(`Aucune configuration de boost pour ce serveur. Utilisez \`${client.getPrefix(message.guild.id)}boostmsg setup\` pour en créer une.`);
            }
            
            const channel = guild.channels.cache.get(config.channelId);
            return message.reply(`Configuration actuelle:\n• Salon: ${channel ? channel.name : 'Introuvable'}\n• Message: "${config.message}"`);
        }
        
        switch (subcommand) {
            case 'setup':
                const setupMessage = await message.reply('Quel salon doit recevoir le message de boost ? Mentionne un salon.');
                
                const channelFilter = (m) => m.author.id === message.author.id;
                const channelCollector = message.channel.createMessageCollector({ 
                    filter: channelFilter, 
                    time: 60000, 
                    max: 1 
                });
                
                channelCollector.on('collect', async (collected) => {
                    const mentionedChannel = collected.mentions.channels.first();
                    
                    if (!mentionedChannel) {
                        return setupMessage.edit('Aucun salon mentionné. Configuration annulée.');
                    }
                    
                    await setupMessage.edit(`Salon configuré: ${mentionedChannel.name}\n\nQuel message souhaitez-vous envoyer ? Utilisez {user} pour mentionner le booster.`);
                    
                    const messageFilter = (m) => m.author.id === message.author.id;
                    const messageCollector = message.channel.createMessageCollector({ 
                        filter: messageFilter, 
                        time: 60000, 
                        max: 1 
                    });
                    
                    messageCollector.on('collect', async (msgCollected) => {
                        const customMessage = msgCollected.content;
                        
                        if (!customMessage.includes('{user}')) {
                            return setupMessage.edit('Le message doit contenir `{user}` pour mentionner le booster. Configuration annulée.');
                        }
                        
                        // Sauvegarder la configuration
                        const config = {
                            channelId: mentionedChannel.id,
                            message: customMessage,
                            enabled: true
                        };
                        
                        client.boostConfig.set(guild.id, config);
                        
                        // Sauvegarder automatiquement
                        client.saveData();
                        
                        await setupMessage.edit(`Configuration terminée !\n• Salon: ${mentionedChannel.name}\n• Message: "${customMessage}"\n\nLes messages de boost sont maintenant activés.`);
                    });
                    
                    messageCollector.on('end', (collected, reason) => {
                        if (reason === 'time') {
                            setupMessage.edit('Délai d\'attente dépassé. Configuration annulée.');
                        }
                    });
                });
                
                channelCollector.on('end', (collected, reason) => {
                    if (reason === 'time') {
                        setupMessage.edit('Délai d\'attente dépassé. Configuration annulée.');
                    }
                });
                break;
                
            case 'disable':
                client.boostConfig.delete(guild.id);
                
                // Sauvegarder automatiquement
                client.saveData();
                
                await message.reply('Messages de boost désactivés pour ce serveur.');
                break;
                
            case 'test':
                const testConfig = client.boostConfig.get(guild.id);
                if (!testConfig) {
                    return message.reply(`Aucune configuration trouvée. Utilisez \`${client.getPrefix(message.guild.id)}boostmsg setup\` d'abord.`);
                }
                
                const testChannel = guild.channels.cache.get(testConfig.channelId);
                if (!testChannel) {
                    return message.reply('Le salon configuré n\'existe plus.');
                }
                
                const testMessage = testConfig.message.replace('{user}', message.author.toString());
                await testChannel.send(testMessage);
                
                await message.reply(`Message de test envoyé dans ${testChannel.name}`);
                break;
                
            default:
                await message.reply(`Usage: \`${client.getPrefix(message.guild.id)}boostmsg [setup|disable|test]\``);
        }
    }
};
