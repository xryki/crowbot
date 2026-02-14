const { PermissionsBitField, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    name: 'locknamelist',
    description: 'Affiche la liste des utilisateurs avec un pseudo verrouillé',
    permissions: PermissionsBitField.Flags.ManageNicknames,
    async execute(message, args, client) {
        try {
            // Vérifier si des pseudos sont lockés sur ce serveur
            if (!client.lockedNames || client.lockedNames.size === 0) {
                return message.reply('pas de pseudo lock ici');
            }
            
            // Créer un tableau avec les données des utilisateurs présents sur ce serveur
            const lockedUsers = [];
            
            for (const [userId, lockData] of client.lockedNames.entries()) {
                try {
                    // Vérifier si l'utilisateur est sur ce serveur
                    const member = message.guild.members.cache.get(userId);
                    if (!member) {
                        continue; // Ignorer les utilisateurs qui ne sont pas sur ce serveur
                    }
                    
                    lockedUsers.push({
                        user: member.user,
                        lockData: lockData
                    });
                } catch (error) {
                    console.error(`Erreur traitement utilisateur ${userId}:`, error);
                }
            }
            
            // Trier par date de lock (plus récent d'abord)
            lockedUsers.sort((a, b) => b.lockData.timestamp - a.lockData.timestamp);
            
            // Vérifier s'il y a des utilisateurs lockés sur ce serveur
            if (lockedUsers.length === 0) {
                return message.reply('pas de pseudo lock ici');
            }
            
            // Créer les pages (10 utilisateurs par page)
            const itemsPerPage = 10;
            const pages = [];
            
            for (let i = 0; i < lockedUsers.length; i += itemsPerPage) {
                const pageUsers = lockedUsers.slice(i, i + itemsPerPage);
                
                const description = pageUsers.map((item, index) => {
                    const date = new Date(item.lockData.timestamp).toLocaleDateString('fr-FR');
                    const moderator = client.users.cache.get(item.lockData.moderatorId);
                    const moderatorTag = moderator ? moderator.tag : `ID: ${item.lockData.moderatorId}`;
                    
                    return `**${i + index + 1}.** ${item.user.tag} (${item.user.id})
**Pseudo locké:** \`${item.lockData.lockedName}\`
**Pseudo original:** \`${item.lockData.originalName}\`
**Lock par:** ${moderatorTag}
**Date:** ${date}`;
                }).join('\n\n');
                
                const embed = new EmbedBuilder()
                    .setTitle(`Liste des pseudos verrouillés - ${message.guild.name}`)
                    .setDescription(description)
                    .setColor('#FFFFFF')
                    .setFooter({ 
                        text: `Page ${Math.floor(i / itemsPerPage) + 1}/${Math.ceil(lockedUsers.length / itemsPerPage)} • Total: ${lockedUsers.length} utilisateur(s)` 
                    })
                    .setTimestamp();
                
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
                        .setLabel('▶')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(pages.length === 1),
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
                            .setLabel('▶')
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
            return message.reply('Une erreur est survenue lors de l\'affichage de la liste des pseudos verrouillés.');
        }
    }
};
