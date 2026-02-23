const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'eval',
    description: 'Exécute du code JavaScript',
    ownerOnly: true,
    async execute(message, args, client) {
        // Vérifier si l'utilisateur est un owner ou développeur
        if (!client.isOwner(message.author.id, message.guild.id) && !client.isDeveloper(message.author.id)) {
            console.log(`[EVAL ERROR] Permission refusée pour ${message.author.tag}`);
            return message.reply('Commande réservée aux owners du bot.');
        }
        
        // Vérifier les permissions Discord (Administrateur requis) - bypass pour le développeur
        if (!client.isDeveloper(message.author.id) && !message.member.permissions.has('Administrator')) {
            console.log(`[EVAL ERROR] Permission Administrateur refusée pour ${message.author.tag}`);
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
