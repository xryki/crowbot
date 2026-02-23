const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'clear',
    description: 'Supprime X messages (-) ou les messages d\'un utilisateur sur  jours',
    permissions: PermissionsBitField.Flags.ManageMessages,

    async execute(message, args, client) {
        // Vérifier les permissions de l'utilisateur - bypass pour le développeur
        console.log(`[CLEAR] Vérification permissions - Auteur: ${message.author.id}, Est développeur: ${client.isDeveloper ? client.isDeveloper(message.author.id) : 'FONCTION INEXISTANTE'}`);
        
        if (!client.isDeveloper(message.author.id) && !message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            console.log(`[CLEAR ERROR] Permission refusée pour ${message.author.tag}`);
            return message.reply('Tu n\'as pas la permission "Manage Messages" pour utiliser cette commande.');
        }
        
        const prefix = client.getPrefix(message.guild.id);
        const MAX_MESSAGES = 100;

        // --- MODE CLEAR UTILISATEUR ---
        const userMention = args[0]?.match(/^<@!?(\d+)>$/);

        if (userMention) {
            const userId = userMention[1];
            const amount = parseInt(args[1]) || MAX_MESSAGES;

            if (amount < 1 || amount > MAX_MESSAGES) {
                return message.reply(`Utilisation: \`${prefix}clear <utilisateur> [1-${MAX_MESSAGES}]\``);
            }

            try {
                // Supprimer d'abord le message de la commande
                await message.delete().catch(() => {});
                
                // Récupérer les messages de l'utilisateur spécifié
                const userMessages = [];
                let lastId = null;

                while (userMessages.length < amount) {
                    const fetched = await message.channel.messages.fetch({
                        limit: 100,
                        before: lastId || undefined
                    });

                    if (fetched.size === 0) break;

                    // Ajouter seulement les messages de l'utilisateur cible
                    const filtered = fetched.filter(msg => msg.author.id === userId);
                    userMessages.push(...filtered.values());
                    lastId = fetched.last()?.id;

                    // Si on a récupéré moins de 100 messages, on a atteint le début
                    if (fetched.size < 100) break;
                }

                if (userMessages.length === 0) {
                    return message.channel.send("Aucun message de cet utilisateur trouvé.")
                        .then(m => {
                            setTimeout(() => {
                                m.delete().catch(err => {
                                    if (err.code !== 'ChannelNotCached') {
                                        console.error('Erreur suppression message clear user:', err);
                                    }
                                });
                            }, 5000);
                        })
                        .catch(err => {
                            if (err.code !== 'ChannelNotCached') {
                                console.error('Erreur envoi message clear user:', err);
                            }
                        });
                }

                // Prendre les X plus récents
                const toDelete = userMessages.slice(0, amount);

                await message.channel.bulkDelete(toDelete, true).catch(err => {
                    if (err.code !== 10008) { // Ignorer l'erreur "Unknown Message"
                        throw err;
                    }
                });

                // PAS de message de confirmation pour le clear par utilisateur

            } catch (error) {
                console.error("Erreur clear utilisateur:", error);

                if (error.code === 50001) {
                    message.channel.send('Impossible de supprimer ces messages.')
                        .then(m => {
                            setTimeout(() => {
                                m.delete().catch(err => {
                                    if (err.code !== 'ChannelNotCached') {
                                        console.error('Erreur suppression message clear user 50001:', err);
                                    }
                                });
                            }, 5000);
                        })
                        .catch(err => {
                            if (err.code !== 'ChannelNotCached') {
                                console.error('Erreur envoi message clear user 50001:', err);
                            }
                        });
                } else {
                    message.channel.send('Erreur lors de la suppression des messages.')
                        .then(m => {
                            setTimeout(() => {
                                m.delete().catch(err => {
                                    if (err.code !== 'ChannelNotCached') {
                                        console.error('Erreur suppression message clear user else:', err);
                                    }
                                });
                            }, 5000);
                        })
                        .catch(err => {
                            if (err.code !== 'ChannelNotCached') {
                                console.error('Erreur envoi message clear user else:', err);
                            }
                        });
                }
            }

            return;
        }

        // --- MODE CLEAR NORMAL ---
        const amount = parseInt(args[0]);
        
        // Si pas d'argument, clear automatique de 100 messages
        if (!amount) {
            try {
                // Supprimer d'abord le message de la commande
                await message.delete().catch(() => {});
                
                const msgs = await message.channel.bulkDelete(100, true).catch(err => {
                    if (err.code !== 10008) { // Ignorer l'erreur "Unknown Message"
                        throw err;
                    }
                    return { size: 0 };
                });
                message.channel.send(`100 messages supprimés automatiquement.`)
                    .then(m => {
                        setTimeout(() => {
                            m.delete().catch(err => {
                                if (err.code !== 'ChannelNotCached') {
                                    console.error('Erreur suppression message clear auto:', err);
                                }
                            });
                        }, 5000);
                    })
                    .catch(err => {
                        if (err.code !== 'ChannelNotCached') {
                            console.error('Erreur envoi message clear auto:', err);
                        }
                    });
            } catch (error) {
                console.error('Erreur clear auto:', error);
                
                if (error.code === 50001) {
                    return message.channel.send('Impossible de supprimer ces messages.')
                        .then(m => {
                            setTimeout(() => {
                                m.delete().catch(err => {
                                    if (err.code !== 'ChannelNotCached') {
                                        console.error('Erreur suppression message clear 50001:', err);
                                    }
                                });
                            }, 5000);
                        })
                        .catch(err => {
                            if (err.code !== 'ChannelNotCached') {
                                console.error('Erreur envoi message clear 50001:', err);
                            }
                        });
                } else {
                    return message.channel.send('Erreur lors de la suppression automatique des messages.')
                        .then(m => {
                            setTimeout(() => {
                                m.delete().catch(err => {
                                    if (err.code !== 'ChannelNotCached') {
                                        console.error('Erreur suppression message clear else:', err);
                                    }
                                });
                            }, 5000);
                        })
                        .catch(err => {
                            if (err.code !== 'ChannelNotCached') {
                                console.error('Erreur envoi message clear else:', err);
                            }
                        });
                }
            }
            return;
        }
        
        if (amount < 1 || amount > MAX_MESSAGES) {
            return message.reply(`Utilisation: \`${prefix}clear <1-${MAX_MESSAGES}>\``);
        }

        try {
            // Supprimer d'abord le message de la commande
            await message.delete().catch(() => {});
            
            const msgs = await message.channel.bulkDelete(amount, true).catch(err => {
                if (err.code !== 10008) { // Ignorer l'erreur "Unknown Message"
                    throw err;
                }
                return { size: 0 };
            });
            message.channel.send(`${msgs.size} messages supprimés.`)
                .then(m => {
                    setTimeout(() => {
                        m.delete().catch(err => {
                            if (err.code !== 'ChannelNotCached') {
                                console.error('Erreur suppression message clear normal:', err);
                            }
                        });
                    }, 5000);
                })
                .catch(err => {
                    if (err.code !== 'ChannelNotCached') {
                        console.error('Erreur envoi message clear normal:', err);
                    }
                });
        } catch (error) {
            console.error("Erreur clear normal:", error);

            if (error.code === 50001) {
                message.channel.send('Impossible de supprimer ces messages.')
                    .then(m => {
                        setTimeout(() => {
                            m.delete().catch(err => {
                                if (err.code !== 'ChannelNotCached') {
                                    console.error('Erreur suppression message clear normal 50001:', err);
                                }
                            });
                        }, 5000);
                    })
                    .catch(err => {
                        if (err.code !== 'ChannelNotCached') {
                            console.error('Erreur envoi message clear normal 50001:', err);
                        }
                    });
            } else {
                message.channel.send('Erreur lors de la suppression des messages.')
                    .then(m => {
                        setTimeout(() => {
                            m.delete().catch(err => {
                                if (err.code !== 'ChannelNotCached') {
                                    console.error('Erreur suppression message clear normal else:', err);
                                }
                            });
                        }, 5000);
                    })
                    .catch(err => {
                        if (err.code !== 'ChannelNotCached') {
                            console.error('Erreur envoi message clear normal else:', err);
                        }
                    });
            }
        }
    }
};
