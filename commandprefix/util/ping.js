module.exports = {
    name: 'ping',
    description: 'Affiche la latence du bot',
    async execute(message, args, client) {
        const sent = await client.autoDeleteMessage(message.channel, 'Calcul du ping...');
        const latency = sent.createdTimestamp - message.createdTimestamp;
        await client.autoDeleteMessage(message.channel, `Pong ! Latency: ${latency}ms | WebSocket: ${message.client.ws.ping}ms`);
    }
};
