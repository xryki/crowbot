module.exports = {
    name: 'restart',
    description: 'Redémarre le bot',
    ownerOnly: true,
    async execute(message) {
        message.reply('Redémarrage du bot...');
        process.exit(0);
    }
};
