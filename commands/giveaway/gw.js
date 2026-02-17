const { PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    name: 'gw',
    description: 'Système de giveaway avancé',
    usage: 'gw [reroll|modify] [message_id]',
    category: 'giveaway',
    permissions: [PermissionFlagsBits.Administrator],
    async execute(message, args, client) {
        // Vérifier si l'utilisateur a les permissions
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply('Tu n\'as pas la permission d\'utiliser cette commande.');
        }

        // Vérifier si c'est une commande reroll
        if (args[0] === 'reroll') {
            if (!args[0]) {
                return message.reply('Usage: gw reroll [message_id]');
            }

            const messageId = args[0];
            const giveaway = client.giveaways?.get(messageId);
            
            if (!giveaway) {
                return message.reply('Giveaway introuvable avec cet ID.');
            }

            // Vérifier si le giveaway est terminé
            if (giveaway.endTime > Date.now()) {
                return message.reply('Ce giveaway n\'est pas encore terminé.');
            }

            // Faire le reroll
            await client.giveawayHandler.rerollGiveaway(messageId, message.channel);
            return;
        }

        // Vérifier si c'est une commande modify
        if (args[0] === 'modify') {
            if (!args[0]) {
                return message.reply('Usage: gw modify [message_id]');
            }

            const messageId = args[0];
            const giveaway = client.giveaways?.get(messageId);
            
            if (!giveaway) {
                return message.reply('Giveaway introuvable avec cet ID.');
            }

            // Afficher le formulaire de modification
            await client.giveawayHandler.showModifyForm(message, messageId);
            return;
        }

        // Créer l'embed de configuration
        const embed = new EmbedBuilder()
            .setColor('FFD')
            .setTitle('Configuration du Giveaway')
            .setDescription('Réponds à ce message avec les informations suivantes:')
            .addFields(
                { name: '. Titre', value: 'Ex: Nitro Classic, Role VIP', inline: false },
                { name: '. Description', value: 'Décris ce que les gens peuvent gagner', inline: false },
                { name: '. Durée', value: 'Format: h, m, j (heures, minutes, jours)', inline: false },
                { name: '. Nombre de gagnants', value: 'Ex: , , ...', inline: false },
                { name: '. Salon', value: 'Mentionne le salon où envoyer le giveaway', inline: false }
            )
            .setFooter({ text: 'Format: titre | description | durée | gagnants | salon' });

        const button = new ButtonBuilder()
            .setCustomId('gw_start_setup')
            .setLabel('Commencer la configuration')
            .setStyle(ButtonStyle.Success);

        const row = new ActionRowBuilder().addComponents(button);

        await message.reply({ embeds: [embed], components: [row] });
    }
};
