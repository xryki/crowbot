const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'snipe',
    description: 'Affiche les messages supprimés (historique jusqu\'à  messages)',
    async execute(message, args, client) {
        // Initialiser la collection de messages snipés si elle n'existe pas
        client.snipes = client.snipes || new Map();
        
        // Charger les snipes sauvegardés
        await loadSnipes(client);
        
        const guildSnipes = client.snipes.get(message.guild.id) || [];
        
        if (guildSnipes.length === 0) {
            return message.reply('Aucun message supprimé récemment.');
        }
        
        let currentIndex = parseInt(args[0]) || 0;
        if (currentIndex < 1 || currentIndex > guildSnipes.length) {
            currentIndex = 1;
        }
        
        await sendSnipeMessage(message, currentIndex, client);
    }
};

// Fonction pour envoyer un message snipe avec des boutons
async function sendSnipeMessage(originalMessage, index, client) {
    const guildSnipes = client.snipes.get(originalMessage.guild.id) || [];
    const snipedMessage = guildSnipes[index - 1];
    
    const embed = new EmbedBuilder()
        .setTitle('Message supprimé')
        .setColor('FFFFFF')
        .setAuthor({
            name: typeof snipedMessage.author === 'string' ? snipedMessage.author : snipedMessage.author.tag
        })
        .setDescription(snipedMessage.content || '(Message vide ou embed)')
        .addFields(
            { name: 'Salon', value: `<${snipedMessage.channelId}>`, inline: true },
            { name: 'Supprimé il y a', value: `${Math.floor((Date.now() - snipedMessage.deletedAt) / 1000)} secondes`, inline: true }
        )
        .setFooter({ 
            text: `Message ${index}/${guildSnipes.length} | Demandé par ${originalMessage.user?.username || originalMessage.author.username}` 
        })
        .setTimestamp();
    
    // Ajouter l'image si le message en contenait une
    if (snipedMessage.attachments && snipedMessage.attachments.size > 0) {
        const attachment = snipedMessage.attachments.first();
        if (attachment.contentType && attachment.contentType.startsWith('image/')) {
            embed.setImage(attachment.url);
            embed.addFields(
                { name: 'Image', value: `[Voir l'image](${attachment.url})`, inline: false }
            );
        }
    }
    
    // Créer les boutons de navigation
    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`snipe_prev_${originalMessage.guild.id}`)
                .setLabel('◀')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(index <= 1),
            new ButtonBuilder()
                .setCustomId(`snipe_next_${originalMessage.guild.id}`)
                .setLabel('▶')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(index >= guildSnipes.length)
        );
    
    // Vérifier si c'est une interaction (bouton) ou un message initial
    if (originalMessage.isMessageComponent?.()) {
        // C'est une interaction, utiliser update
        await originalMessage.update({ embeds: [embed], components: [row] });
    } else {
        // C'est un message initial, utiliser reply
        const msg = await originalMessage.reply({ embeds: [embed], components: [row] });
        
        // Créer un collector pour les interactions avec les boutons
        const collector = msg.createMessageComponentCollector({ 
            time: 900000 // 15 minute
        });
        
        collector.on('collect', async (interaction) => {
            if (interaction.user.id !== originalMessage.author.id) {
                await interaction.reply({ content: 'Seul l\'auteur de la commande peut utiliser ces boutons.', ephemeral: true });
                return;
            }
            
            if (interaction.customId.includes('prev')) {
                const newIndex = Math.max(1, index - 1);
                await sendSnipeMessage(interaction, newIndex, client);
            } else if (interaction.customId.includes('next')) {
                const newIndex = Math.min(guildSnipes.length, index + 1);
                await sendSnipeMessage(interaction, newIndex, client);
            }
        });
        
        collector.on('end', () => {
            msg.edit({ components: [] }).catch(() => {});
        });
    }
}

// Fonction pour charger les snipes depuis un fichier
async function loadSnipes(client) {
    try {
        const snipesPath = path.join(__dirname, '../../data/snipes.json');
        if (fs.existsSync(snipesPath)) {
            const data = fs.readFileSync(snipesPath, 'utf-8');
            const snipesData = JSON.parse(data);
            
            // Convertir les objets en Map
            client.snipes = new Map(Object.entries(snipesData));
            
            // Restaurer les objets User et Guild manquants
            for (const [guildId, guildSnipes] of client.snipes) {
                for (const snipe of guildSnipes) {
                    if (typeof snipe.author === 'string') {
                        snipe.author = { tag: snipe.author, id: snipe.authorId };
                    }
                }
            }
        }
    } catch (error) {
        console.error('Erreur lors du chargement des snipes:', error);
    }
}

// Fonction pour sauvegarder les snipes dans un fichier
async function saveSnipes(client) {
    try {
        const snipesPath = path.join(__dirname, '../../data/snipes.json');
        const dataDir = path.dirname(snipesPath);
        
        // Créer le dossier data s'il n'existe pas
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        
        // Convertir la Map en objet pour la sauvegarde
        const snipesData = {};
        for (const [guildId, guildSnipes] of client.snipes) {
            snipesData[guildId] = guildSnipes.map(snipe => ({
                ...snipe,
                author: snipe.author.tag,
                authorId: snipe.author.id
            }));
        }
        
        fs.writeFileSync(snipesPath, JSON.stringify(snipesData, null, 2));
    } catch (error) {
        console.error('Erreur lors de la sauvegarde des snipes:', error);
    }
}
