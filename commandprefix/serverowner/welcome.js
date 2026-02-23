const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'welcome',
    description: 'Configure le message de bienvenue',
    permissions: PermissionsBitField.Flags.Administrator,
    async execute(message, args, client) {
        const guild = message.guild;
        
        // Initialiser DataSaver
        const dataSaver = require('../../dataSaver');
        
        // Initialiser les données de bienvenue si elles n'existent pas
        if (!client.welcomeMessages) {
            client.welcomeMessages = new Map();
        }
        
        const subcommand = args[0]?.toLowerCase();
        
        if (!subcommand) {
            // Afficher le statut actuel
            const welcomeData = client.welcomeMessages.get(guild.id);
            
            if (!welcomeData) {
                return message.reply(`Aucun message de bienvenue configuré. Utilisez \`${client.getPrefix(message.guild.id)}welcome channel salon\` puis \`${client.getPrefix(message.guild.id)}welcome message votre message\``);
            }
            
            return message.reply(`Message de bienvenue configuré dans <${welcomeData.channelId}> :\n"${welcomeData.message}"`);
        }
        
        switch (subcommand) {
            case 'channel':
                const channel = message.mentions.channels.first();
                if (!channel) {
                    return message.reply('Mentionne un salon !');
                }
                
                // Créer ou mettre à jour la configuration
                let welcomeData = client.welcomeMessages.get(guild.id) || {};
                welcomeData.channelId = channel.id;
                
                client.welcomeMessages.set(guild.id, welcomeData);
                
                // Sauvegarder automatiquement
                client.saveData();
                
                await message.reply(`Salon de bienvenue configuré : <#${channel.id}>`);
                break;
                
            case 'message':
                const welcomeMessage = args.slice(1).join(' ');
                if (!welcomeMessage) {
                    return message.reply('Écris un message de bienvenue !');
                }
                
                // Récupérer ou créer la configuration
                let messageData = client.welcomeMessages.get(guild.id) || {};
                
                if (!messageData.channelId) {
                    return message.reply('Configure d\'abord le salon avec `!welcome channel salon`');
                }
                
                messageData.message = welcomeMessage;
                client.welcomeMessages.set(guild.id, messageData);
                
                // Sauvegarder automatiquement
                client.saveData();
                
                await message.reply('Message de bienvenue mis à jour !');
                break;
                
            case 'test':
                const testData = client.welcomeMessages.get(guild.id);
                if (!testData) {
                    return message.reply('Aucun message de bienvenue configuré.');
                }
                
                if (!testData.channelId) {
                    return message.reply('Aucun salon de bienvenue configuré.');
                }
                
                if (!testData.message) {
                    return message.reply('Aucun message de bienvenue configuré.');
                }
                
                const testChannel = guild.channels.cache.get(testData.channelId);
                if (!testChannel) {
                    return message.reply('Le salon configuré n\'existe plus.');
                }
                
                // Remplacer les variables pour le test
                let testMessageContent = testData.message
                    .replace(/{user}/g, message.author.toString())
                    .replace(/{username}/g, message.author.username)
                    .replace(/{server}/g, guild.name)
                    .replace(/{memberCount}/g, guild.memberCount.toString())
                    .replace(/{avatar}/g, message.author.displayAvatarURL());
                
                await testChannel.send(testMessageContent);
                await message.reply('Message de bienvenue testé !');
                break;
                
            case 'variables':
                const variablesText = `Variables disponibles :
{user} → Mention de l'utilisateur
{username} → Nom de l'utilisateur  
{server} → Nom du serveur
{memberCount} → Nombre de membres
{avatar} → URL de l'avatar`;
                
                await message.reply(`\`\`\`${variablesText}\`\`\``);
                break;
                
            case 'disable':
                client.welcomeMessages.delete(guild.id);
                
                // Sauvegarder automatiquement
                client.saveData();
                
                await message.reply('Message de bienvenue désactivé.');
                break;
                
            default:
                await message.reply(`Usage: \`${client.getPrefix(message.guild.id)}welcome [channel|message|test|variables|disable]\``);
        }
    }
};
