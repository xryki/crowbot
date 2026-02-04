const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

// Gestionnaire d'interactions pour les tickets
module.exports = {
    handleTicketInteraction: async (interaction, client) => {
        try {
            const { guild, channel, member } = interaction;
            
            // Récupérer la configuration des tickets
            const ticketConfig = client.tickets?.get(guild.id);
            if (!ticketConfig) return;

            const getPanelConfig = (panelKey = 'support') => {
                if (ticketConfig.panels) {
                    return ticketConfig.panels[panelKey] || null;
                }
                return ticketConfig;
            };

            const getSupportRoleIds = (panelCfg) => {
                const ids = [];
                if (panelCfg?.supportRoles && Array.isArray(panelCfg.supportRoles)) {
                    ids.push(...panelCfg.supportRoles);
                }
                if (panelCfg?.supportRoleId) {
                    ids.push(panelCfg.supportRoleId);
                }
                return [...new Set(ids.filter(Boolean))];
            };
        
        // Création de ticket
        if (interaction.customId === 'create_ticket' || interaction.customId.startsWith('create_ticket:')) {
            const panelKey = interaction.customId.includes(':') ? interaction.customId.split(':')[1] : 'support';
            const panelCfg = getPanelConfig(panelKey);
            if (!panelCfg) {
                await interaction.reply({ content: 'Ce panel de tickets n\'est pas configuré.', ephemeral: true });
                return;
            }

            const options = panelKey === 'recrutement'
                ? [
                    {
                        label: 'Candidature Staff',
                        description: 'Ouvrir un ticket de recrutement',
                        value: 'staff_application'
                    }
                ]
                : [
                    {
                        label: 'Support Général',
                        description: 'Questions générales et aide',
                        value: 'support_general'
                    },
                    {
                        label: 'Report de Joueur',
                        description: 'Signaler un joueur',
                        value: 'report_player'
                    },
                    {
                        label: 'Problème Technique',
                        description: 'Bug ou problème technique',
                        value: 'technical_issue'
                    },
                    {
                        label: 'Suggestion',
                        description: 'Proposer une amélioration',
                        value: 'suggestion'
                    },
                    {
                        label: 'Autre',
                        description: 'Autre demande',
                        value: 'other'
                    }
                ];

            await interaction.reply({
                content: 'Choisissez la raison de votre ticket :',
                ephemeral: true,
                components: [
                    new ActionRowBuilder().addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId(`ticket_reason:${panelKey}`)
                            .setPlaceholder('Sélectionnez une raison')
                            .addOptions(options)
                    )
                ]
            });
        }
        
        // Sélection de la raison du ticket
        if (interaction.customId === 'ticket_reason' || interaction.customId.startsWith('ticket_reason:')) {
            const panelKey = interaction.customId.includes(':') ? interaction.customId.split(':')[1] : 'support';
            const panelCfg = getPanelConfig(panelKey);
            if (!panelCfg) {
                await interaction.reply({ content: 'Ce panel de tickets n\'est pas configuré.', ephemeral: true });
                return;
            }

            const reason = interaction.values[0];
            const reasonLabels = panelKey === 'recrutement'
                ? {
                    'staff_application': 'Candidature Staff'
                }
                : {
                    'support_general': 'Support Général',
                    'report_player': 'Report de Joueur',
                    'technical_issue': 'Problème Technique',
                    'suggestion': 'Suggestion',
                    'other': 'Autre'
                };
            
            // Mettre à jour l'interaction avec gestion d'erreur
            try {
                await interaction.update({ content: 'Création du ticket en cours...', components: [] });
            } catch (error) {
                if (error.code === 10062) { // Unknown interaction
                    console.log('Interaction expirée lors de la création du ticket');
                    return; // Arrêter le traitement si l'interaction a expiré
                } else {
                    console.error('Erreur mise à jour interaction création:', error);
                    return;
                }
            }
            
            try {
                // Créer le salon de ticket
                const ticketNumber = Date.now();
                const channelName = `ticket-${ticketNumber}`;

                const supportRoleIds = getSupportRoleIds(panelCfg);
                const permissionOverwrites = [
                    {
                        id: guild.id,
                        deny: ['ViewChannel', 'SendMessages']
                    },
                    {
                        id: interaction.user.id,
                        allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'AttachFiles']
                    },
                    {
                        id: client.user.id,
                        allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'ManageChannels']
                    }
                ];

                for (const roleId of supportRoleIds) {
                    permissionOverwrites.push({
                        id: roleId,
                        allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory']
                    });
                }

                const ticketChannel = await guild.channels.create({
                    name: channelName,
                    type: 0, // GUILD_TEXT
                    parent: panelCfg.categoryId || null,
                    permissionOverwrites
                });
                
                // Créer l'embed du ticket
                const ticketEmbed = new EmbedBuilder()
                    .setTitle(`Ticket #${ticketNumber}`)
                    .setDescription(`Raison : ${reasonLabels[reason] || reason}\n\nCréé par : ${interaction.user}\n\nVeuillez décrire votre demande en détail.`)
                    .setColor('#0099ff')
                    .addFields(
                        { name: 'Instructions', value: '• Décrivez votre problème clairement\n• Attendez qu\'un membre du staff réponde\n• Soyez patient et respectueux', inline: false }
                    )
                    .setFooter({ text: `Ticket créé par ${interaction.user.tag}` })
                    .setTimestamp();
                
                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('close_ticket')
                            .setLabel('Fermer le ticket')
                            .setStyle(ButtonStyle.Danger),
                        new ButtonBuilder()
                            .setCustomId('claim_ticket')
                            .setLabel('Prendre en charge')
                            .setStyle(ButtonStyle.Success),
                        new ButtonBuilder()
                            .setCustomId('rename_ticket')
                            .setLabel('Renommer')
                            .setStyle(ButtonStyle.Secondary)
                    );
                
                const supportMention = supportRoleIds.length > 0 ? supportRoleIds.map(id => `<@&${id}>`).join(' ') : 'Staff';
                const ticketMessage = await ticketChannel.send({
                    content: `${interaction.user} | ${supportMention}`,
                    embeds: [ticketEmbed],
                    components: [row]
                });
                
                // Sauvegarder les informations du ticket
                if (!client.ticketData) {
                    client.ticketData = new Map();
                }
                
                client.ticketData.set(ticketChannel.id, {
                    userId: interaction.user.id,
                    panelKey: panelKey,
                    reason: reason,
                    createdAt: Date.now(),
                    messageId: ticketMessage.id
                });
                
                // Sauvegarder immédiatement les données du ticket
                const DataSaver = require('../dataSaver');
                const dataSaver = new DataSaver();
                dataSaver.saveData('ticketDataActive', Object.fromEntries(client.ticketData));
                
                await interaction.followUp({
                    content: `Votre ticket a été créé : ${ticketChannel}`,
                    ephemeral: true
                });
                
            } catch (error) {
                console.error('Erreur création ticket:', error);
                await interaction.followUp({
                    content: 'Une erreur est survenue lors de la création du ticket.',
                    ephemeral: true
                });
            }
        }
        
        // Fermeture de ticket
        if (interaction.customId === 'close_ticket') {
            const channel = interaction.channel;
            const ticketData = client.ticketData?.get(channel.id);
            
            if (!ticketData) {
                await interaction.reply({ content: 'Ce ticket n\'existe pas.', ephemeral: true });
                return;
            }
            
            const confirmEmbed = new EmbedBuilder()
                .setTitle('Fermeture du ticket')
                .setDescription('Êtes-vous sûr de vouloir fermer ce ticket ?')
                .setColor('#ff9900');
            
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('confirm_close')
                        .setLabel('Confirmer')
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId('cancel_close')
                        .setLabel('Annuler')
                        .setStyle(ButtonStyle.Secondary)
                );
            
            await interaction.reply({ embeds: [confirmEmbed], components: [row] });
        }
        
        // Confirmation de fermeture
        if (interaction.customId === 'confirm_close') {
            const channel = interaction.channel;
            const ticketData = client.ticketData?.get(channel.id);
            const ticketConfig = client.tickets?.get(guild.id);
            
            if (!ticketData) return;

            const panelKey = ticketData.panelKey || 'support';
            const panelCfg = ticketConfig?.panels ? (ticketConfig.panels[panelKey] || null) : ticketConfig;
            
            // Créer le transcript
            let transcript = '=== TRANSCRIPT DU TICKET ===\n\n';
            transcript += `Ticket créé par : <@${ticketData.userId}>\n`;
            transcript += `Raison : ${ticketData.reason}\n`;
            transcript += `Créé le : <t:${Math.floor(ticketData.createdAt / 1000)}:F>\n`;
            transcript += `Fermé le : <t:${Math.floor(Date.now() / 1000)}:F>\n`;
            transcript += `Fermé par : ${interaction.user.tag}\n\n`;
            transcript += '=== MESSAGES ===\n\n';
            
            try {
                const messages = await channel.messages.fetch({ limit: 100 });
                messages.forEach(msg => {
                    transcript += `[${msg.createdAt.toISOString()}] ${msg.author.tag}: ${msg.content}\n`;
                });
                
                // Envoyer le transcript si configuré
                if (panelCfg?.transcriptChannelId) {
                    const transcriptChannel = guild.channels.cache.get(panelCfg.transcriptChannelId);
                    if (transcriptChannel) {
                        const transcriptEmbed = new EmbedBuilder()
                            .setTitle(`Transcript - Ticket #${channel.name}`)
                            .setDescription(`Transcript du ticket fermé par ${interaction.user}`)
                            .setColor('#ff9900')
                            .setTimestamp();
                        
                        await transcriptChannel.send({
                            embeds: [transcriptEmbed],
                            files: [{
                                attachment: Buffer.from(transcript, 'utf-8'),
                                name: `transcript-${channel.name}.txt`
                            }]
                        });
                    }
                }
                
                // Envoyer la transcription en MP au créateur du ticket
                try {
                    const creator = await client.users.fetch(ticketData.userId);
                    if (creator) {
                        const dmEmbed = new EmbedBuilder()
                            .setTitle('Ticket Fermé - Transcript')
                            .setDescription(`Votre ticket "${channel.name}" a été fermé par ${interaction.user.tag}`)
                            .setColor('#ff9900')
                            .addFields(
                                { name: 'Raison du ticket', value: ticketData.reason, inline: false },
                                { name: 'Durée', value: `<t:${Math.floor(ticketData.createdAt / 1000)}:R>`, inline: false }
                            )
                            .setTimestamp();
                        
                        await creator.send({
                            embeds: [dmEmbed],
                            files: [{
                                attachment: Buffer.from(transcript, 'utf-8'),
                                name: `transcript-${channel.name}.txt`
                            }]
                        });
                    }
                } catch (dmError) {
                    console.log('Impossible d\'envoyer la transcription en MP à l\'utilisateur:', dmError.message);
                    // Ne pas bloquer la fermeture du ticket si l'MP échoue
                }
                
            } catch (error) {
                console.error('Erreur création transcript:', error);
            }
            
            // Mettre à jour l'interaction avec gestion d'erreur
            try {
                await interaction.update({ content: 'Fermeture du ticket...', components: [] });
            } catch (error) {
                if (error.code === 10062) { // Unknown interaction
                    console.log('Interaction expirée, envoi d\'un message normal');
                    await channel.send('Fermeture du ticket...');
                } else {
                    console.error('Erreur mise à jour interaction:', error);
                    await channel.send('Fermeture du ticket...');
                }
            }
            
            // Supprimer le salon après un court délai
            setTimeout(async () => {
                try {
                    await channel.delete('Ticket fermé');
                    client.ticketData.delete(channel.id);
                    
                    // Sauvegarder immédiatement après suppression
                    const DataSaver = require('../dataSaver');
                    const dataSaver = new DataSaver();
                    dataSaver.saveData('ticketDataActive', Object.fromEntries(client.ticketData));
                } catch (error) {
                    console.error('Erreur suppression canal ticket:', error);
                }
            }, 3000);
        }
        
        // Annulation de fermeture
        if (interaction.customId === 'cancel_close') {
            try {
                await interaction.update({ content: 'Fermeture annulée.', components: [] });
            } catch (error) {
                if (error.code === 10062) { // Unknown interaction
                    console.log('Interaction expirée lors de l\'annulation de fermeture');
                    return;
                } else {
                    console.error('Erreur mise à jour interaction annulation:', error);
                    return;
                }
            }
        }
        
        // Prise en charge du ticket
        if (interaction.customId === 'claim_ticket') {
            const channel = interaction.channel;
            const ticketData = client.ticketData?.get(channel.id);
            
            if (!ticketData) {
                await interaction.reply({ content: 'Ce ticket n\'existe pas.', ephemeral: true });
                return;
            }
            
            const claimEmbed = new EmbedBuilder()
                .setTitle('Ticket pris en charge')
                .setDescription(`Ce ticket est maintenant pris en charge par ${interaction.user}`)
                .setColor('#00ff00')
                .setTimestamp();
            
            await channel.send({ embeds: [claimEmbed] });
            await interaction.reply({ content: 'Ticket pris en charge avec succès.', ephemeral: true });
        }
        
        // Renommage du ticket
        if (interaction.customId === 'rename_ticket') {
            const channel = interaction.channel;
            const ticketData = client.ticketData?.get(channel.id);
            
            if (!ticketData) {
                await interaction.reply({ content: 'Ce ticket n\'existe pas.', ephemeral: true });
                return;
            }
            
            // Vérifier les permissions (créateur du ticket ou staff)
            const member = await guild.members.fetch(interaction.user.id);
            const isTicketCreator = ticketData.userId === interaction.user.id;

            const panelKey = ticketData.panelKey || 'support';
            const panelCfg = ticketConfig?.panels ? (ticketConfig.panels[panelKey] || null) : ticketConfig;
            const supportRoleIds = getSupportRoleIds(panelCfg);
            const hasStaffRole = supportRoleIds.length > 0
                ? supportRoleIds.some(roleId => member.roles.cache.has(roleId))
                : member.permissions.has('ManageChannels');
            
            if (!isTicketCreator && !hasStaffRole) {
                await interaction.reply({ content: 'Vous n\'avez pas la permission de renommer ce ticket.', ephemeral: true });
                return;
            }
            
            // Créer le modal pour le renommage
            const modal = new ModalBuilder()
                .setCustomId('rename_ticket_modal')
                .setTitle('Renommer le ticket');
            
            const nameInput = new TextInputBuilder()
                .setCustomId('ticket_name')
                .setLabel('Nouveau nom du ticket')
                .setPlaceholder('Ex: support-probleme-connexion')
                .setStyle(TextInputStyle.Short)
                .setMinLength(3)
                .setMaxLength(100)
                .setValue(channel.name.replace('ticket-', ''));
            
            const actionRow = new ActionRowBuilder().addComponents(nameInput);
            modal.addComponents(actionRow);
            
            await interaction.showModal(modal);
        }
        
        // Gestion du modal de renommage
        if (interaction.isModalSubmit() && interaction.customId === 'rename_ticket_modal') {
            const channel = interaction.channel;
            const ticketData = client.ticketData?.get(channel.id);
            const ticketConfig = client.tickets?.get(guild.id);
            
            if (!ticketData) {
                await interaction.reply({ content: 'Ce ticket n\'existe pas.', ephemeral: true });
                return;
            }
            
            // Vérifier les permissions à nouveau
            const member = await guild.members.fetch(interaction.user.id);
            const isTicketCreator = ticketData.userId === interaction.user.id;

            const panelKey = ticketData.panelKey || 'support';
            const panelCfg = ticketConfig?.panels ? (ticketConfig.panels[panelKey] || null) : ticketConfig;
            const supportRoleIds = getSupportRoleIds(panelCfg);
            const hasStaffRole = supportRoleIds.length > 0
                ? supportRoleIds.some(roleId => member.roles.cache.has(roleId))
                : member.permissions.has('ManageChannels');
            
            if (!isTicketCreator && !hasStaffRole) {
                await interaction.reply({ content: 'Vous n\'avez pas la permission de renommer ce ticket.', ephemeral: true });
                return;
            }
            
            const newName = interaction.fields.getTextInputValue('ticket_name');
            const finalName = newName.startsWith('ticket-') ? newName : `ticket-${newName}`;
            
            try {
                await channel.setName(finalName);
                
                const renameEmbed = new EmbedBuilder()
                    .setTitle('Ticket renommé')
                    .setDescription(`Le ticket a été renommé en \`${finalName}\` par ${interaction.user}`)
                    .setColor('#00ff00')
                    .setTimestamp();
                
                await channel.send({ embeds: [renameEmbed] });
                await interaction.reply({ content: `Le ticket a été renommé avec succès en \`${finalName}\``, ephemeral: true });
                
            } catch (error) {
                console.error('Erreur renommage ticket:', error);
                await interaction.reply({ content: 'Une erreur est survenue lors du renommage du ticket.', ephemeral: true });
            }
        }
        
        } catch (error) {
            console.error('Erreur dans handleTicketInteraction:', error);
            
            // Gérer les erreurs d'interaction expirée
            if (error.code === 10062) { // Unknown interaction
                console.log('Interaction expirée dans handleTicketInteraction');
                return;
            }
            
            // Essayer de répondre à l'utilisateur si possible
            try {
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ 
                        content: 'Une erreur est survenue lors du traitement de votre demande.', 
                        ephemeral: true 
                    });
                } else {
                    await interaction.reply({ 
                        content: 'Une erreur est survenue lors du traitement de votre demande.', 
                        ephemeral: true 
                    });
                }
            } catch (replyError) {
                console.error('Impossible de répondre à l\'interaction:', replyError);
            }
        }
    }
};
