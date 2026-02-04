const { PermissionsBitField, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'rename',
    description: 'Renomme le salon actuel',
    permissions: PermissionsBitField.Flags.ManageChannels,
    async execute(message, args, client) {
        const channel = message.channel;
        
        // Vérifier si l'utilisateur a les permissions
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            // Vérifier si c'est un ticket et si l'utilisateur est le créateur
            const ticketData = client.ticketData?.get(channel.id);
            if (!ticketData || ticketData.userId !== message.author.id) {
                return message.reply('Vous n\'avez pas la permission de renommer ce salon.');
            }
        }
        
        const newName = args.join(' ');
        
        if (!newName) {
            return message.reply(`Veuillez spécifier un nouveau nom pour le salon. Usage: \`${client.getPrefix(message.guild.id)}rename <nouveau_nom>\``);
        }
        
        if (newName.length < 3 || newName.length > 100) {
            return message.reply('Le nom doit contenir entre 3 et 100 caractères.');
        }
        
        // Ajouter le préfixe ticket- si c'est un ticket et que le nom ne l'a pas déjà
        const ticketData = client.ticketData?.get(channel.id);
        let finalName = newName;
        
        if (ticketData && !newName.startsWith('ticket-')) {
            finalName = `ticket-${newName}`;
        }
        
        try {
            await channel.setName(finalName);
            
            const embed = new EmbedBuilder()
                .setTitle('Salon renommé')
                .setDescription(`Le salon a été renommé en \`${finalName}\` par ${message.author}`)
                .setColor('#00ff00')
                .setTimestamp();
            
            await message.channel.send({ embeds: [embed] });
            
            // Supprimer le message de commande pour garder le salon propre
            if (message.deletable) {
                await message.delete().catch(() => {});
            }
            
        } catch (error) {
            console.error('Erreur renommage salon:', error);
            await message.reply('Une erreur est survenue lors du renommage du salon.');
        }
    }
};
