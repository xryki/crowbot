const { PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    name: 'locknamelist',
    description: 'Affiche la liste des utilisateurs avec un pseudo verrouillé',
    permissions: PermissionsBitField.Flags.ManageNicknames,
    async execute(message, args, client) {
        // Vérifier les permissions de l'utilisateur - bypass pour le développeur
        console.log(`[LOCKNAMELIST] Vérification permissions - Auteur: ${message.author.id}, Est développeur: ${client.isDeveloper ? client.isDeveloper(message.author.id) : 'FONCTION INEXISTANTE'}`);
        
        if (!client.isDeveloper(message.author.id) && !message.member.permissions.has(PermissionsBitField.Flags.ManageNicknames)) {
            console.log(`[LOCKNAMELIST ERROR] Permission refusée pour ${message.author.tag}`);
            return message.reply('Tu n\'as pas la permission "ManageNicknames" pour utiliser cette commande.');
        }
        

        try {
            // Vérifier si des pseudos sont lockés
            if (!client.lockedNames || client.lockedNames.size === 0) {
                return message.reply('Aucun pseudo verrouillé.');
            }
            
            // Créer la liste des IDs
            const lockedIds = Array.from(client.lockedNames.keys());
            const itemsPerPage = 10;
            
            // Créer les pages
            const pages = [];
            for (let i = 0; i < lockedIds.length; i += itemsPerPage) {
                const pageIds = lockedIds.slice(i, i + itemsPerPage);
                
                const description = pageIds.map((userId, index) => {
                    const lockData = client.lockedNames.get(userId);
                    const user = client.users.cache.get(userId);
                    const userTag = user ? user.tag : `Utilisateur inconnu (${userId})`;
                    return `${i + index + 1}. **${userTag}** → "${lockData.lockedName}"`;
                }).join('\n');
                
                const embed = {
                    color: 0x3498db,
                    title: 'Utilisateurs avec pseudo verrouillé',
                    description: description,
                    footer: {
                        text: `Page ${Math.floor(i / itemsPerPage) + 1}/${Math.ceil(lockedIds.length / itemsPerPage)} • Total: ${lockedIds.length} utilisateur(s)`
                    },
                    timestamp: new Date().toISOString()
                };
                
                pages.push(embed);
            }
            
            // Si une seule page, l'envoyer directement
            if (pages.length === 1) {
                return message.reply({ embeds: [pages[0]] });
            }
            
            // Navigation avec boutons
            let currentPage = 0;
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('prev')
                        .setLabel('◀')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId('next')
                        .setLabel('◀')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(pages.length === 0),
                    new ButtonBuilder()
                        .setCustomId('stop')
                        .setLabel('X')
                        .setStyle(ButtonStyle.Danger)
                );
            
            const msg = await message.reply({ 
                embeds: [pages[currentPage]], 
                components: [row] 
            });
            
            const collector = msg.createMessageComponentCollector({ 
                time: 60000 
            });
            
            collector.on('collect', async (interaction) => {
                if (interaction.user.id !== message.author.id) {
                    return interaction.reply({ 
                        content: 'Seul l\'auteur peut utiliser ces boutons!', 
                        ephemeral: true 
                    });
                }
                
                await interaction.deferUpdate();
                
                if (interaction.customId === 'prev') {
                    currentPage = Math.max(0, currentPage - 1);
                } else if (interaction.customId === 'next') {
                    currentPage = Math.min(pages.length - 1, currentPage + 1);
                } else if (interaction.customId === 'stop') {
                    collector.stop();
                    return msg.edit({ components: [] });
                }
                
                const newRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('prev')
                            .setLabel('◀')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(currentPage === 0),
                        new ButtonBuilder()
                            .setCustomId('next')
                            .setLabel('\u25b6')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(currentPage === pages.length - 1),
                        new ButtonBuilder()
                            .setCustomId('stop')
                            .setLabel('X')
                            .setStyle(ButtonStyle.Danger)
                    );
                
                await msg.edit({ 
                    embeds: [pages[currentPage]], 
                    components: [newRow] 
                });
            });
            
            collector.on('end', () => {
                msg.edit({ components: [] }).catch(() => {});
            });
            
        } catch (error) {
            console.error('Erreur dans la commande locknamelist:', error);
            return message.reply('Une erreur est survenue.');
        }
    }
};
