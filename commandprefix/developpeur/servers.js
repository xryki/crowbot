const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'servers',
    description: 'Affiche tous les serveurs où le bot est présent',
    developerOnly: true,
    async execute(message, args, client) {
        // Vérifier si l'utilisateur est le développeur
        if (!client.isDeveloper(message.author.id)) {
            return message.reply('Commande réservée au développeur du bot.');
        }
        const servers = client.guilds.cache.map(guild => ({
            name: guild.name,
            id: guild.id,
            members: guild.memberCount,
            owner: guild.ownerId,
            createdAt: guild.createdAt
        }));

        const embed = new EmbedBuilder()
            .setTitle(`Serveurs du bot (${servers.length})`)
            .setColor('FFFFFF')
            .setTimestamp();

        // Diviser en pages si trop de serveurs
        const pageSize = 10;
        const pages = [];
        
        for (let i = 0; i < servers.length; i += pageSize) {
            const page = servers.slice(i, i + pageSize);
            const description = page.map(server => 
                `${server.name} (\`${server.id}\`)\n` +
                `${server.members} membres | Owner: <@${server.owner}>\n` +
                `Cre: <t:${Math.floor(server.createdAt / 1000)}:R>\n`
            ).join('\n');

            pages.push(new EmbedBuilder()
                .setTitle(`Serveurs du bot (${i + 1}-${Math.min(i + pageSize, servers.length)}/${servers.length})`)
                .setDescription(description)
                .setColor('FFFFFF')
                .setTimestamp()
            );
        }

        // Envoyer la première page
        if (pages.length === 0) {
            await message.reply({ embeds: [embed] });
        } else {
            // Système de pagination simple
            let currentPage = 0;
            const msg = await message.reply({ 
                embeds: [pages[currentPage]],
                components: [
                    {
                        type: 1, // Action Row
                        components: [
                            {
                                type: 2, // Button
                                style: 1, // Primary
                                label: '\u25c0',
                                customId: 'prev_page',
                                disabled: currentPage === 0
                            },
                            {
                                type: 2, // Button
                                style: 2, // Secondary
                                label: `${currentPage + 1}/${pages.length}`,
                                customId: 'page_counter',
                                disabled: true
                            },
                            {
                                type: 2, // Button
                                style: 1, // Primary
                                label: '▶',
                                customId: 'next_page',
                                disabled: currentPage === pages.length - 1
                            }
                        ]
                    }
                ]
            });

            const collector = msg.createMessageComponentCollector({ 
                time: 60000 //  minute
            });

            collector.on('collect', async (interaction) => {
                if (interaction.user.id !== message.author.id) {
                    await interaction.reply({ content: 'Vous ne pouvez pas utiliser ces boutons.', ephemeral: true });
                    return;
                }

                if (interaction.customId === 'prev_page' && currentPage > 0) {
                    currentPage--;
                } else if (interaction.customId === 'next_page' && currentPage < pages.length - 1) {
                    currentPage++;
                }

                await interaction.update({
                    embeds: [pages[currentPage]],
                    components: [
                        {
                            type: 1, // Action Row
                            components: [
                                {
                                    type: 2, // Button
                                    style: 1, // Primary
                                    label: '◀',
                                    customId: 'prev_page',
                                    disabled: currentPage === 0
                                },
                                {
                                    type: 2, // Button
                                    style: 2, // Secondary
                                    label: `${currentPage + 1}/${pages.length}`,
                                    customId: 'page_counter',
                                    disabled: true
                                },
                                {
                                    type: 2, // Button
                                    style: 1, // Primary
                                    label: '▶',
                                    customId: 'next_page',
                                    disabled: currentPage === pages.length - 1
                                }
                            ]
                        }
                    ]
                });
            });

            collector.on('end', () => {
                msg.edit({ components: [] }).catch(() => {});
            });
        }
    }
};
