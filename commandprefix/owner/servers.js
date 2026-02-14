const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'servers',
    description: 'Affiche tous les serveurs où le bot est présent',
    permissions: null, // Owner only (vérifié dans index.js)
    async execute(message, args, client) {
        const servers = client.guilds.cache.map(guild => ({
            name: guild.name,
            id: guild.id,
            members: guild.memberCount,
            owner: guild.ownerId,
            createdAt: guild.createdAt
        }));

        const embed = new EmbedBuilder()
            .setTitle(`Serveurs du bot (${servers.length})`)
            .setColor('#FFFFFF')
            .setTimestamp();

        // Diviser en pages si trop de serveurs
        const pageSize = 10;
        const pages = [];
        
        for (let i = 0; i < servers.length; i += pageSize) {
            const page = servers.slice(i, i + pageSize);
            const description = page.map(server => 
                `**${server.name}** (\`${server.id}\`)\n` +
                `${server.members} membres | Owner: <@${server.owner}>\n` +
                `Créé: <t:${Math.floor(server.createdAt / 1000)}:R>\n`
            ).join('\n');

            pages.push(new EmbedBuilder()
                .setTitle(`Serveurs du bot (${i + 1}-${Math.min(i + pageSize, servers.length)}/${servers.length})`)
                .setDescription(description)
                .setColor('#FFFFFF')
                .setTimestamp()
            );
        }

        // Envoyer la première page
        if (pages.length === 1) {
            await message.reply({ embeds: [pages[0]] });
        } else {
            // Système de pagination simple
            let currentPage = 0;
            const msg = await message.reply({ 
                embeds: [pages[currentPage]],
                components: [
                    {
                        type: 1,
                        components: [
                            {
                                type: 2,
                                style: 1,
                                label: '◀',
                                customId: 'prev_page',
                                disabled: currentPage === 0
                            },
                            {
                                type: 2,
                                style: 2,
                                label: `${currentPage + 1}/${pages.length}`,
                                customId: 'page_counter',
                                disabled: true
                            },
                            {
                                type: 2,
                                style: 1,
                                label: '▶',
                                customId: 'next_page',
                                disabled: currentPage === pages.length - 1
                            }
                        ]
                    }
                ]
            });

            const collector = msg.createMessageComponentCollector({ 
                time: 60000 // 1 minute
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
                            type: 1,
                            components: [
                                {
                                    type: 2,
                                    style: 1,
                                    label: '◀',
                                    customId: 'prev_page',
                                    disabled: currentPage === 0
                                },
                                {
                                    type: 2,
                                    style: 2,
                                    label: `${currentPage + 1}/${pages.length}`,
                                    customId: 'page_counter',
                                    disabled: true
                                },
                                {
                                    type: 2,
                                    style: 1,
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
