const {eventBus, eventBusTag} = require('eventBus');

function randomSentence() {
    const words = ['successful', 'science', 'unused', 'things', 'tumble', 'embarrassed', 'pear', 'obnoxious', 'belong', 'feeling', 'rain', 'letter', 'toad', 'tie', 'plough', 'smell', 'dear', 'bubble', 'house', 'waiting'];
    let sentence = '';
    for (let i=0; i<10; i++) {
        sentence += words[Math.floor(Math.random()*words.length)] + ' ';
    }
    return sentence;
}

function randomType() {
    const types = ['danger', 'warning', 'success'];
    return types[Math.floor(Math.random()*types.length)];
}

/**
 * Test adding a notification from the UI
 *
 * @param {Object} kwargs: { notification }
 * @return {Object} A formated success message.
 */

const notificationsTest = async ({notification}) => {
    if (!notification) {
        const randomName = `notification-${String(Math.random()).slice(2)}`;
        notification = {
            id: randomName,
            type: randomType(),
            title: randomName,
            body: randomSentence(),
        };
    }
    eventBus.emit(eventBusTag.pushNotification, notification);

    return {
        message: `Added notification ${JSON.stringify(notification)}`,
        logMessage: true,
        userAction: true,
    };
};


module.exports = notificationsTest;
