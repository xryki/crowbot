const { PermissionsBitField, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    name: 'helpall',
    description: 'Affiche les commandes par niveaux de permission',
    skipLogging: true, // Ne pas logger la commande helpall
    async execute(message, args, client) {
        const prefix = client.getPrefix(message.guild.id);
        
        // Si l'utilisateur n'est pas owner, refuser l'accès
        if (!client.isOwner(message.author.id, message.guild.id)) {
            return message.reply('Cette commande est réservée aux owners du bot.');
        }
        
        // Titre et description uniformes
        const embedTitle = "Liste des commandes par permissions";
        const embedDescription = "Les paramètres peuvent être des noms, des mentions, ou des IDs\nSi ce ne sont pas des mentions ils doivent être séparés par ,,";
        
        // Regrouper les commandes par niveau de permission
        const commandsByPermLevel = new Map();
        commandsByPermLevel.set('public', []); // Catégorie Public
        for (let i = 1; i <= 9; i++) {
            commandsByPermLevel.set(i.toString(), []);
        }
        commandsByPermLevel.set('owner', []); // Catégorie Owner
        
        client.prefixCommands.forEach(cmd => {
            // Ignorer les commandes sans nom ou invalides
            if (!cmd || !cmd.name || typeof cmd.name !== 'string') {
                return;
            }
            
            // Ignorer les handlers et les commandes owner privées
            if (cmd.name.toLowerCase().includes('handler') || ['owners', 'ownerlist', 'setowner', 'serverowners'].includes(cmd.name)) {
                return;
            }
            
            // Déterminer si c'est une commande owner ou publique
            let permLevel = 'public'; // Par défaut publique
            
            // Commandes owner spécifiques
            if (['eval', 'restart', 'boostmsg', 'helpall', 'setperm', 'delperm', 'editperm', 'perms', 'myperm', 'owners', 'ownerlist', 'setowner', 'serverowners', 'gw'].includes(cmd.name)) {
                permLevel = 'owner';
            }
            
            commandsByPermLevel.get(permLevel).push(cmd);
        });
        
        // Créer les pages : Public et Owner
        const pages = [];
        const orderedLevels = ['public', 'owner'];
        
        orderedLevels.forEach(level => {
            const commands = commandsByPermLevel.get(level) || [];
            if (commands.length > 0) {
                // Créer la liste des commandes
                const commandList = commands.map(cmd => {
                    // Vérifier que la commande est valide
                    if (!cmd || !cmd.name || typeof cmd.name !== 'string') {
                        return null;
                    }
                    
                    // Utiliser le usage si disponible, sinon juste le nom
                    if (cmd.usage) {
                        return `\`${prefix}${cmd.name} ${cmd.usage}\``;
                    }
                    return `\`${prefix}${cmd.name}\``;
                }).filter(cmd => cmd !== null).join('\n');
                
                const categoryName = level === 'public' ? 'Public' : level === 'owner' ? 'Owner' : `Perm ${level}`;
                
                const embed = new EmbedBuilder()
                    .setTitle(embedTitle)
                    .setColor('#2C2F33') // Couleur sombre comme sur le screen
                    .setDescription(embedDescription)
                    .addFields({
                        name: categoryName,
                        value: commandList,
                        inline: false
                    })
                    .setFooter({ text: `Page ${pages.length + 1} • Utilise les flèches pour naviguer` })
                    .setTimestamp();
                
                pages.push(embed);
            }
        });
        
        if (pages.length === 0) {
            return message.reply('Aucune commande disponible.');
        }
        
        // Créer les boutons de navigation
        let currentPage = 0;
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('prev')
                    .setLabel('<')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true),
                new ButtonBuilder()
                    .setCustomId('next')
                    .setLabel('>')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(pages.length === 1),
                new ButtonBuilder()
                    .setCustomId('stop')
                    .setLabel('X')
                    .setStyle(ButtonStyle.Danger)
            );
        
        // Envoyer le premier embed
        const msg = await message.reply({ 
            embeds: [pages[currentPage]], 
            components: [row] 
        });
        
        // Créer le collector pour les interactions
        const collector = msg.createMessageComponentCollector({ 
            time: 60000 // 60 secondes
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
            
            // Mettre à jour les boutons
            row.components[0].setDisabled(currentPage === 0);
            row.components[1].setDisabled(currentPage === pages.length - 1);
            
            await msg.edit({ 
                embeds: [pages[currentPage]], 
                components: [row] 
            });
        });
        
        collector.on('end', () => {
            msg.edit({ components: [] }).catch(() => {});
        });
    }
};
