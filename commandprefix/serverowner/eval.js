const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'eval',
    description: 'Exécute du code JavaScript',
    ownerOnly: true,
    async execute(message, args, client) {
        // Vérifier si l'utilisateur est un owner
        if (!client.isOwner(message.author.id, message.guild.id)) {
            return message.reply('Commande réservée aux owners du bot.');
        }
        
        // Vérifier les permissions Discord (Administrateur requis)
        if (!message.member.permissions.has('Administrator')) {
            return message.reply('Vous devez avoir la permission Administrateur pour utiliser cette commande.');
        }
        
        const code = args.join(' ');
        if (!code) return message.reply('Code requis !');
        
        try {
            let evaled = eval(code);
            
            // Convertit en string si pas string
            if (typeof evaled !== 'string') {
                evaled = require('util').inspect(evaled, { depth: 2 });
            }
            
            const embed = new EmbedBuilder()
                .setTitle('Eval Result')
                .setColor('FFFFFF')
                .addFields(
                    { name: 'Input', value: `\`\`\`js\n${code}\n\`\`\``, inline: false },
                    { name: 'Output', value: `\`\`\`js\n${evaled}\n\`\`\``, inline: false }
                );
            
            message.reply({ embeds: [embed] });
        } catch (error) {
            const embed = new EmbedBuilder()
                .setTitle('Eval Error')
                .setColor('FFFFFF')
                .addFields({ name: 'Erreur', value: `\`\`\`${error.message}\n\`\`\`` });
            message.reply({ embeds: [embed] });
        }
    }
};
