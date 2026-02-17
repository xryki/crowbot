const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'antiRaidHandler',
    async execute(client, message) {
        // Verifier si l'anti-raid est active
        if (!client.antiraid || !client.antiraid.enabled) return;
        
        const guild = message.guild;
        const author = message.author;
        const member = message.member;
        
        // Verifier si l'utilisateur est whitelist
        if (client.antiraid?.globalWhitelist?.includes(author.id)) return;
        if (member.roles.cache.some(role => client.antiraid?.globalWhitelist?.includes(role.id))) return;
        
        // Fonction pour envoyer les logs
        const sendLog = async (action, reason, extra = {}) => {
            if (client.antiraid?.logChannel) {
                const logChannel = guild.channels.cache.get(client.antiraid.logChannel);
                if (logChannel) {
                    const embed = new EmbedBuilder()
                        .setTitle('Anti-Raid Action')
                        .setColor('FFBB')
                        .addFields(
                            { name: 'Action', value: action, inline: true },
                            { name: 'Utilisateur', value: `${author.tag} (${author.id})`, inline: true },
                            { name: 'Raison', value: reason, inline: false }
                        )
                        .setTimestamp();
                    
                    if (extra.details) embed.addFields({ name: 'Details', value: extra.details, inline: false });
                    if (extra.duration) embed.addFields({ name: 'Duree', value: extra.duration, inline: true });
                    
                    await logChannel.send({ embeds: [embed] });
                }
            }
        };
        
        // Fonction pour executer une action
        const executeAction = async (action, reason, details) => {
            try {
                switch (action) {
                    case 'delete':
                        try {
                            await message.delete();
                        } catch (error) {
                            if (error.code === 0) {
                                console.log(`Message déjà supprimé ou introuvable dans anti-raid`);
                            } else {
                                console.error('Erreur suppression message anti-raid:', error);
                            }
                        }
                        await sendLog('Message Supprime', reason, { details });
                        break;
                        
                    case 'warn':
                        await message.reply(`Attention: ${reason}`);
                        await sendLog('Avertissement', reason, { details });
                        break;
                        
                    case 'mute':
                        const muteRole = guild.roles.cache.find(role => role.name === 'Muted');
                        if (muteRole) {
                            await member.roles.add(muteRole);
                            await sendLog('Mute', reason, { details, duration: 'Temporaire' });
                        }
                        break;
                        
                    case 'kick':
                        await member.kick(reason);
                        await sendLog('Kick', reason, { details });
                        break;
                        
                    case 'ban':
                        await guild.members.ban(author.id, { reason });
                        await sendLog('Ban', reason, { details });
                        break;
                }
            } catch (error) {
                console.error('Erreur lors de l\'execution de l\'action anti-raid:', error);
            }
        };
        
        // Anti-Link
        if (client.antiraid?.antiLink?.enabled) {
            // Ignorer les liens vers des images/GIF (tenor, giphy, imgur, etc.)
            const gifDomains = /(tenor\.com|giphy\.com|imgur\.com|i\.imgur\.com|giphy\.giphy\.com|media\.giphy\.com)/gi;
            const linkRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|discord\.gg\/[^\s]+)/gi;
            
            if (linkRegex.test(message.content) && !gifDomains.test(message.content)) {
                await executeAction(client.antiraid?.antiLink?.action || 'delete', 'Liens détectés', `Message: ${message.content.substring(0, 100)}`);
                return;
            }
        }
        
        // Anti-Spam
        if (client.antiraid?.antiSpam?.enabled) {
            if (!client.spamTracker) client.spamTracker = new Map();
            if (!client.spamTracker.has(author.id)) {
                client.spamTracker.set(author.id, { messages: [], lastReset: Date.now() });
            }
            
            const userSpam = client.spamTracker.get(author.id);
            userSpam.messages.push(Date.now());
            
            // Nettoyer les vieux messages
            userSpam.messages = userSpam.messages.filter(time => 
                Date.now() - time < (client.antiraid?.antiSpam?.timeWindow || 5000)
            );
            
            if (userSpam.messages.length >= (client.antiraid?.antiSpam?.maxMessages || 5)) {
                await executeAction(client.antiraid?.antiSpam?.action || 'mute', 'Spam détecté', 
                    `${userSpam.messages.length} messages en ${(client.antiraid?.antiSpam?.timeWindow || 5000)/1000}s`);
                return;
            }
        }
        
        // Anti-Token (comptes recents)
        if (client.antiraid?.antiToken?.enabled) {
            const accountAge = Date.now() - author.createdTimestamp;
            if (accountAge < (client.antiraid?.antiToken?.maxAccountAge || 86400000)) {
                await executeAction(client.antiraid?.antiToken?.action || 'kick', 
                    'Compte trop recent', 
                    `Age: ${Math.floor(accountAge / 86400000)} jours (min: ${Math.floor((client.antiraid?.antiToken?.maxAccountAge || 86400000) / 86400000)} jours)`);
                return;
            }
        }
        
        // Anti-Bot
        if (client.antiraid?.antiBot?.enabled && author.bot) {
            await executeAction(client.antiraid?.antiBot?.action || 'kick', 'Bot détecté', `Bot: ${author.tag}`);
            return;
        }
        
        // Anti-Webhook
        if (client.antiraid?.antiWebhook?.enabled && message.webhookId) {
            await executeAction(client.antiraid?.antiWebhook?.action || 'delete', 'Webhook détecté', `Webhook ID: ${message.webhookId}`);
            return;
        }
        
        // Anti-Mass Mention
        if (client.antiraid?.antiMassMention?.enabled) {
            const mentions = message.mentions.users.size + message.mentions.roles.size;
            if (mentions >= (client.antiraid?.antiMassMention?.maxMentions || 3)) {
                await executeAction(client.antiraid?.antiMassMention?.action || 'mute', 
                    'Mass mentions détectées', 
                    `${mentions} mentions (max: ${client.antiraid?.antiMassMention?.maxMentions || 3})`);
                return;
            }
        }
        
        // Anti-Caps
        if (client.antiraid?.antiCaps?.enabled) {
            const content = message.content;
            if (content.length > 0) { // Ignorer les courts messages
                const capsCount = (content.match(/[A-Z]/g) || []).length;
                const capsPercentage = (capsCount / content.length) * 100;
                
                if (capsPercentage >= (client.antiraid?.antiCaps?.maxCaps || 70)) {
                    await executeAction(client.antiraid?.antiCaps?.action || 'delete', 
                        'Trop de majuscules', 
                        `${Math.round(capsPercentage)}% majuscules (max: ${client.antiraid?.antiCaps?.maxCaps || 70}%)`);
                    return;
                }
            }
        }
        
        // Anti-Invite
        if (client.antiraid?.antiInvite?.enabled) {
            const inviteRegex = /(discord\.(gg|io|me|com)\/[^\s]+)|(discord\.com\/invite\/[^\s]+)/gi;
            if (inviteRegex.test(message.content)) {
                await executeAction(client.antiraid?.antiInvite?.action || 'delete', 'Invitation Discord détectée', `Message: ${message.content.substring(0, 100)}`);
                return;
            }
        }
    }
};
