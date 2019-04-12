const express = require('express');
const bodyParser = require('body-parser');
const { WebhookClient } = require('dialogflow-fulfillment');
const Nexmo = require('nexmo');
const socketio = require('socket.io');
const app = express().use(bodyParser.json());
const port = process.env.PORT || 8080;

// Init Nexmo
const nexmo = new Nexmo({
    apiKey: '578d520e',
    apiSecret: '8V25q2Za82CXMzT2'
}, { debug: true });

app.post('/webhook', (request, response) => {

    const _agent = new WebhookClient({ request: request, response: response });

    function welcome(agent) {
        agent.add('welcome agent');
    }

    function fallback(agent) {
        agent.add(`I didn't understand.`);
    }

    function sendmessage(agent) {
        const number = agent.parameters.number;
        const text = agent.parameters.message;
        nexmo.message.sendSms(
            'YOURVURTUALNUMBER', number, text, { type: 'unicode' },
            (err, responseData) => {
                if (err) {
                    console.log(err);
                    agent.add(err); 
                } else {
                    const { messages } = responseData;
                    const { ['message-id']: id, ['to']: number, ['error-text']: error } = messages[0];
                    console.dir(responseData);
                    agent.add(responseData);
                    // Get data from response
                    const data = {
                        id,
                        number,
                        error
                    };

                    // Emit to the client
                    io.emit('smsStatus', data);
                }
            }
        );

    }

    let intentMap = new Map();
    intentMap.set('Default Welcome Intent', welcome);
    intentMap.set('Default Fallback Intent', fallback);
    intentMap.set('SendMessage', sendmessage);
    _agent.handleRequest(intentMap);
})

// Start server
const server = app.listen(port, () => console.log(`Server started on port ${port}`));

// Connect to socket.io
const io = socketio(server);
io.on('connection', (socket) => {
  console.log('Connected');
  io.on('disconnect', () => {
    console.log('Disconnected');
  })
});