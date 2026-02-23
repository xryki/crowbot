module.exports = {
    name: 'restart',
    description: 'Redémarre le bot',
    developerOnly: true,
    async execute(message, args, client) {
        // Vérifier si l'utilisateur est le développeur
        if (!client.isDeveloper(message.author.id)) {
            return message.reply('Commande réservée au développeur du bot.');
        }
        
        message.reply('Redémarrage du bot...');
        process.exit();
    }
};
