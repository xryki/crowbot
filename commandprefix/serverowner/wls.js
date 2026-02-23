const { PermissionsBitField, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    name: 'wls',
    description: 'Affiche la liste des utilisateurs whitelistés',
    ownerOnly: true,
    async execute(message, args, client) {
        // Vérifier si l'utilisateur est un owner
        if (!client.isOwner(message.author.id, message.guild.id) && !client.isDeveloper(message.author.id)) {
            console.log(`[WLS ERROR] Permission refusée pour ${message.author.tag}`);
            return message.reply('Commande réservée aux owners du bot.');
        }        
        // Vérifier les permissions Discord (Administrateur requis)
        if (!client.isDeveloper(message.author.id) && !message.member.permissions.has('Administrator')) {
            console.log(`[WLS ERROR] Permission Administrateur refusée pour ${message.author.tag}`);
            return message.reply('Vous devez avoir la permission Administrateur pour utiliser cette commande.');
        }
        
        try {
            // Vérifier si des utilisateurs sont whitelistés
            if (!client.whitelist || client.whitelist.length === 0) {
                return message.reply('pas de whitelist ici');
            }
            
            // Créer un tableau avec les données des utilisateurs whitelistés
            const whitelistedUsers = [];
            
            for (const userId of client.whitelist) {
                try {
                    // Récupérer l'utilisateur depuis l'API Discord
                    const user = await client.users.fetch(userId).catch(() => null);
                    if (user) {
                        whitelistedUsers.push({
                            user: user
                        });
                    }
                } catch (error) {
                    console.error(`Erreur traitement utilisateur ${userId}:`, error);
                }
            }
            
            // Vérifier s'il y a des utilisateurs whitelistés
            if (whitelistedUsers.length === 0) {
                return message.reply('pas de whitelist ici');
            }
            
            // Trier par nom d'utilisateur
            whitelistedUsers.sort((a, b) => a.user.username.localeCompare(b.user.username));
            
            // Créer les pages (10 utilisateurs par page)
            const itemsPerPage = 10;
            const pages = [];
            
            for (let i = 0; i < whitelistedUsers.length; i += itemsPerPage) {
                const pageUsers = whitelistedUsers.slice(i, i + itemsPerPage);
                
                const description = pageUsers.map((item, index) => {
                    return `${i + index + 1}. <@${item.user.id}> - **${item.user.tag}**`;
                }).join('\n');
                
                const embed = new EmbedBuilder()
                    .setTitle('Liste des whitelistés')
                    .setDescription(description)
                    .setColor('FFFFFF')
                    .setFooter({ 
                        text: `Page ${Math.floor(i / itemsPerPage) + 1}/${Math.ceil(whitelistedUsers.length / itemsPerPage)} • Total: ${whitelistedUsers.length} utilisateur(s)` 
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
            console.error('Erreur dans la commande wls:', error);
            return message.reply('Une erreur est survenue lors de l\'affichage de la whitelist.');
        }
    }
};
