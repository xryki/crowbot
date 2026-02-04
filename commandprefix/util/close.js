const { PermissionsBitField, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    name: 'close',
    description: 'Ferme le ticket actuel',
    permissions: PermissionsBitField.Flags.ManageChannels,
    async execute(message, args, client) {
        const channel = message.channel;
        const guild = message.guild;
        
        // Vérifier si c'est un ticket
        const ticketData = client.ticketData?.get(channel.id);
        if (!ticketData) {
            return message.reply('Ce n\'est pas un ticket valide.');
        }
        
        // Vérifier les permissions (staff ou créateur du ticket)
        const member = await guild.members.fetch(message.author.id);
        const isTicketCreator = ticketData.userId === message.author.id;
        const hasStaffRole = client.tickets?.get(guild.id)?.supportRoleId ? 
            member.roles.cache.has(client.tickets.get(guild.id).supportRoleId) : 
            member.permissions.has('ManageChannels');
        
        if (!isTicketCreator && !hasStaffRole) {
            return message.reply('Vous n\'avez pas la permission de fermer ce ticket.');
        }
        
        // Demander confirmation
        const confirmEmbed = new EmbedBuilder()
            .setTitle('Fermeture du ticket')
            .setDescription('Êtes-vous sûr de vouloir fermer ce ticket ?')
            .setColor('#ff9900')
            .addFields(
                { name: 'Ticket', value: `#${channel.name}`, inline: true },
                { name: 'Créé par', value: `<@${ticketData.userId}>`, inline: true }
            );
        
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('confirm_close_cmd')
                    .setLabel('Confirmer')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('cancel_close_cmd')
                    .setLabel('Annuler')
                    .setStyle(ButtonStyle.Secondary)
            );
        
        const confirmMessage = await message.reply({ embeds: [confirmEmbed], components: [row] });
        
        // Créer un collector pour les boutons
        const filter = (interaction) => 
            (interaction.customId === 'confirm_close_cmd' || interaction.customId === 'cancel_close_cmd') &&
            interaction.user.id === message.author.id;
        
        const collector = confirmMessage.createMessageComponentCollector({ 
            filter, 
            time: 30000 // 30 secondes
        });
        
        collector.on('collect', async (interaction) => {
            if (interaction.customId === 'confirm_close_cmd') {
                await interaction.update({ content: 'Fermeture du ticket...', components: [] });
                
                // Utiliser la même logique que le bouton de fermeture
                const ticketConfig = client.tickets?.get(guild.id);
                
                // Créer le transcript
                let transcript = '=== TRANSCRIPT DU TICKET ===\n\n';
                transcript += `Ticket créé par : <@${ticketData.userId}>\n`;
                transcript += `Raison : ${ticketData.reason}\n`;
                transcript += `Créé le : <t:${Math.floor(ticketData.createdAt / 1000)}:F>\n`;
                transcript += `Fermé le : <t:${Math.floor(Date.now() / 1000)}:F>\n`;
                transcript += `Fermé par : ${message.author.tag}\n\n`;
                transcript += '=== MESSAGES ===\n\n';
                
                try {
                    const messages = await channel.messages.fetch({ limit: 100 });
                    messages.forEach(msg => {
                        transcript += `[${msg.createdAt.toISOString()}] ${msg.author.tag}: ${msg.content}\n`;
                    });
                    
                    // Envoyer le transcript si configuré
                    if (ticketConfig?.transcriptChannelId) {
                        const transcriptChannel = guild.channels.cache.get(ticketConfig.transcriptChannelId);
                        if (transcriptChannel) {
                            const transcriptEmbed = new EmbedBuilder()
                                .setTitle(`Transcript - Ticket #${channel.name}`)
                                .setDescription(`Transcript du ticket fermé par ${message.author}`)
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
                                .setDescription(`Votre ticket "${channel.name}" a été fermé par ${message.author.tag}`)
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
                    }
                    
                } catch (error) {
                    console.error('Erreur création transcript:', error);
                }
                
                // Supprimer le salon après un court délai
                setTimeout(async () => {
                    try {
                        await channel.delete('Ticket fermé par commande');
                        client.ticketData.delete(channel.id);
                    } catch (error) {
                        console.error('Erreur suppression canal ticket:', error);
                    }
                }, 3000);
                
            } else if (interaction.customId === 'cancel_close_cmd') {
                await interaction.update({ content: 'Fermeture annulée.', components: [] });
            }
        });
        
        collector.on('end', (collected, reason) => {
            if (reason === 'time') {
                confirmMessage.edit({ content: 'Délai d\'attente dépassé. Fermeture annulée.', components: [] });
            }
        });
    }
};
