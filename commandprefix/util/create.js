const { PermissionsBitField } = require('discord.js');
const axios = require('axios');

module.exports = {
    name: 'create',
    description: 'Ajoute un emoji au serveur',
    permissions: PermissionsBitField.Flags.ManageEmojisAndStickers,
    async execute(message, args, client) {
        console.log(`[CREATE] Commande exécutée par ${message.author.tag} avec ${args.length} arguments`);
        
        const guild = message.guild;
        
        // Vérifier si le bot a les permissions
        if (!guild.members.me.permissions.has(PermissionsBitField.Flags.ManageEmojisAndStickers)) {
            console.log('[CREATE] Permission manquante');
            return message.reply('Je n\'ai pas la permission de gérer les emojis du serveur.');
        }
        
        // Mode : Réponse à un message avec emoji
        if (message.reference) {
            console.log('[CREATE] Mode réponse activé');
            try {
                const referencedMessage = await message.fetchReference();
                console.log(`[CREATE] Message référencé récupéré: ${referencedMessage.content.length} caractères`);
                
                // Parser les emojis du message référencé
                const emojisToCreate = [];
                const emojiRegex = /<a?:(.+?):(\d+)>/g;
                let match;
                const foundEmojis = new Set();
                
                while ((match = emojiRegex.exec(referencedMessage.content)) !== null) {
                    const isAnimated = match[0].startsWith('<a:');
                    const emojiName = match[1];
                    const emojiId = match[2];
                    
                    if (foundEmojis.has(emojiId)) continue;
                    foundEmojis.add(emojiId);
                    
                    const extension = isAnimated ? 'gif' : 'png';
                    const emojiUrl = `https://cdn.discordapp.com/emojis/${emojiId}.${extension}`;
                    
                    emojisToCreate.push({
                        name: emojiName.replace(/[^a-zA-Z-_]/g, '_').substring(0, 32),
                        url: emojiUrl,
                        id: emojiId,
                        animated: isAnimated
                    });
                }
                
                // Ajouter les emojis custom des réactions
                const reactionEmojis = referencedMessage.reactions.cache
                    .filter(reaction => reaction.emoji.id)
                    .map(reaction => ({
                        name: reaction.emoji.name.replace(/[^a-zA-Z-_]/g, '_').substring(0, 32),
                        url: reaction.emoji.url,
                        id: reaction.emoji.id,
                        animated: reaction.emoji.animated
                    }));
                
                const allEmojis = [...emojisToCreate, ...reactionEmojis];
                console.log(`[CREATE] ${allEmojis.length} emojis trouvés au total`);
                
                if (allEmojis.length === 0) {
                    console.log('[CREATE] Aucun emoji trouvé');
                    return message.reply('Aucun emoji trouvé dans le message référencé.');
                }
                
                // Traiter les emojis séquentiellement
                console.log('[CREATE] Début traitement séquentiel');
                const results = await processEmojisSequentially(allEmojis, guild, message);
                console.log(`[CREATE] Résultats: ${results.success.length} succès, ${results.failed.length} échecs`);
                
                return message.reply(`${results.success.length} emoji(s) ajouté(s) - ${results.failed.length} emoji(s) ignoré(s)`);
                
            } catch (error) {
                console.error('[CREATE] Erreur traitement message référencé:', error);
                return message.reply('Impossible de lire le message référencé.');
            }
        }
        
        // Mode : Arguments directs avec emojis
        console.log('[CREATE] Mode arguments directs');
        if (args.length === 0) {
            console.log('[CREATE] Aucun argument fourni');
            return message.reply(`Usage: \`${client.getPrefix(message.guild.id)}create <emoji>\` ou \`${client.getPrefix(message.guild.id)}create <emoji> <emoji> <emoji>\` ou en répondant à un message contenant des emojis.`);
        }
        
        // Parser les emojis des arguments
        const content = args.join(' ');
        console.log(`[CREATE] Contenu à parser: "${content}"`);
        const emojisToCreate = [];
        const emojiRegex = /<a?:(.+?):(\d+)>/g;
        let match;
        const foundEmojis = new Set();
        
        while ((match = emojiRegex.exec(content)) !== null) {
            const isAnimated = match[0].startsWith('<a:');
            const emojiName = match[1];
            const emojiId = match[2];
            
            if (foundEmojis.has(emojiId)) continue;
            foundEmojis.add(emojiId);
            
            const extension = isAnimated ? 'gif' : 'png';
            const emojiUrl = `https://cdn.discordapp.com/emojis/${emojiId}.${extension}`;
            
            emojisToCreate.push({
                name: emojiName.replace(/[^a-zA-Z-_]/g, '_').substring(0, 32),
                url: emojiUrl,
                id: emojiId,
                animated: isAnimated
            });
        }
        
        console.log(`[CREATE] ${emojisToCreate.length} emojis parsés depuis les arguments`);
        
        if (emojisToCreate.length === 0) {
            console.log('[CREATE] Aucun emoji valide trouvé');
            return message.reply('Aucun emoji valide trouvé dans les arguments.');
        }
        
        // Traiter les emojis séquentiellement
        console.log('[CREATE] Début traitement séquentiel des arguments');
        const results = await processEmojisSequentially(emojisToCreate, guild, message);
        console.log(`[CREATE] Résultats finaux: ${results.success.length} succès, ${results.failed.length} échecs`);
        
        if (args.length === 1 && emojisToCreate.length === 1) {
            const result = results.success[0] || results.failed[0];
            if (result.emoji) {
                console.log('[CREATE] Envoi réponse succès simple');
                message.reply(`L'emoji ${result.emoji} est crée`);
            } else {
                console.log('[CREATE] Envoi réponse échec simple');
                message.reply(result.error || 'Impossible d\'ajouter cet emoji.');
            }
        } else {
            console.log('[CREATE] Envoi réponse multiple');
            message.reply(`${results.success.length} emoji(s) ajouté(s) - ${results.failed.length} emoji(s) ignoré(s)`);
        }
    }
};

// Fonction pour traiter les emojis séquentiellement (optimisée)
async function processEmojisSequentially(emojisToCreate, guild, message) {
    console.log(`[PROCESS] Début traitement de ${emojisToCreate.length} emojis`);
    const results = {
        success: [],
        failed: []
    };
    
    for (let i = 0; i < emojisToCreate.length; i++) {
        const emojiData = emojisToCreate[i];
        console.log(`[PROCESS] Traitement emoji ${i+1}/${emojisToCreate.length}: ${emojiData.name}`);
        
        try {
            // Vérifier si l'emoji existe déjà par nom
            const existingEmoji = guild.emojis.cache.find(e => e.name === emojiData.name);
            if (existingEmoji) {
                console.log(`[PROCESS] Emoji ${emojiData.name} existe déjà`);
                results.failed.push({
                    name: emojiData.name,
                    error: 'Cet emoji existe déjà dans le serveur.'
                });
                continue;
            }
            
            // Télécharger l'image avec axios
            console.log(`[PROCESS] Téléchargement de ${emojiData.url}`);
            const response = await axios.get(emojiData.url, {
                responseType: 'arraybuffer',
                timeout: 5000
            });
            
            const buffer = Buffer.from(response.data);
            console.log(`[PROCESS] Buffer reçu: ${buffer.length} bytes`);
            
            // Verifier la taille (max 256 KB)
            if (buffer.length > 262144) {
                console.log(`[PROCESS] Emoji ${emojiData.name} trop volumineux`);
                results.failed.push({
                    name: emojiData.name,
                    error: 'Fichier trop volumineux (max 256 KB)'
                });
                continue;
            }
            
            // Créer l'emoji
            console.log(`[PROCESS] Création de l'emoji ${emojiData.name}`);
            const emoji = await guild.emojis.create({
                attachment: buffer,
                name: emojiData.name,
                reason: `Ajouté par ${message.author.tag}`
            });
            
            console.log(`[PROCESS] Emoji ${emojiData.name} créé avec succès: ${emoji.toString()}`);
            results.success.push({
                name: emojiData.name,
                emoji: emoji.toString()
            });
            
        } catch (error) {
            console.error(`[PROCESS] Erreur traitement emoji ${emojiData.name}:`, error);
            let errorMsg = 'Erreur lors de l\'ajout de l\'emoji';
            
            if (error.response) {
                if (error.response.status === 404) {
                    errorMsg = 'Emoji introuvable';
                } else if (error.response.status === 429) {
                    errorMsg = 'Rate limit atteint';
                }
            } else if (error.code === 'ETIMEDOUT') {
                errorMsg = 'Timeout de téléchargement';
            }
            
            results.failed.push({
                name: emojiData.name,
                error: errorMsg
            });
        }
    }
    
    console.log(`[PROCESS] Traitement terminé: ${results.success.length} succès, ${results.failed.length} échecs`);
    return results;
}
