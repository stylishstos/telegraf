const https = require('https');

const TOKEN = require('./token');

const basicOptions = {
    hostname: 'api.telegram.org',
    port: 443,
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    }
};

class TemegramBot {
    constructor(token) {
        this.token = token;
    }

    call(method, args) {
        return new Promise((resolve) => {
            let data = '';

            const req = https.request(
                {
                    path: `/bot${this.token}/${method}`,
                    ...basicOptions,
                },
                (res) => {
                    res.on('data', (_data) => data += _data);
                    res.on('end', () => {
                        const response = JSON.parse(data);

                        resolve(response ? response.result : undefined);
                    });
                }
            );

            if (args) {
                req.write(JSON.stringify(args));
            }

            req.end();
        });
    }

    async getUpdates() {
        this.updateId = this.updateId || 0;

        console.log(`Waiting updates from ${this.updateId}`);

        const updates = await this.call('getUpdates', { offset: this.updateId, timeout: 5, limit: 100 });

        if (updates.length) {
            console.log(`Received ${updates.length} update(s)`);

            this.updateId = updates[updates.length - 1].update_id + 1;
        }

        return updates;
    }

    handleUpdates(updates) {
        updates.forEach(({ message, edited_message }) => {
            if (message) {
                this.call('sendMessage', { chat_id: message.from.id, text: `Слушай ${message.chat.first_name}, не пиши фигни. Вот мой хозяин Толя фигни не пишет. Будь, как Толя.` });
            } else if (edited_message) {
                this.call('sendMessage', { chat_id: edited_message.from.id, text: edited_message.text });
            }
        });
    }

    async start() {
        while (true) {
            const updates = await this.getUpdates();
            this.handleUpdates(updates);
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
}

const bot = new TemegramBot(TOKEN);
bot.start();
