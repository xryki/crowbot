const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'eval',
    description: 'Exécute du code JavaScript',
    ownerOnly: true,
    async execute(message, args) {
        const code = args.join(' ');
        if (!code) return message.reply('Code requis !');
        
        try {
            let evaled = eval(code);
            
            // Convertit en string si pas string
            if (typeof evaled !== 'string') {
                evaled = require('util').inspect(evaled, { depth: 0 });
            }
            
            const embed = new EmbedBuilder()
                .setTitle('Eval Result')
                .setColor('#FFFFFF')
                .addFields(
                    { name: 'Input', value: `\`\`\`js\n${code}\n\`\`\``, inline: false },
                    { name: 'Output', value: `\`\`\`js\n${evaled}\n\`\`\``, inline: false }
                );
            
            message.reply({ embeds: [embed] });
        } catch (error) {
            const embed = new EmbedBuilder()
                .setTitle('Eval Error')
                .setColor('#FFFFFF')
                .addFields({ name: 'Erreur', value: `\`\`\`${error.message}\n\`\`\`` });
            message.reply({ embeds: [embed] });
        }
    }
};
