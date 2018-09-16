const JRFWS = require('./jrfws');
const jrfwsClient = new JRFWS();

async function sendMes() {

    await jrfwsClient.sendMes(null, 'not found path');
    // step1; step6; step7;

    await jrfwsClient.sendMes('only data');
    // step1; step6;

    await jrfwsClient.sendMes(null, 'users');
    // step1; step2; step6;

    await jrfwsClient.sendMes({users: []}, 'users', 'add');
    // step1; step2; step3; step6;

    await jrfwsClient.sendMes(null, 'users.roles');
    // step1; step2; step4; step6;

    await jrfwsClient.sendMes(null, 'users/roles');
    // step1; step2; step4; step6;

    await jrfwsClient.sendMes({role: 'Rick'}, 'users.roles', 'add');
    // step1; step2; step4; step5; step6;

}

async function initClient() {

    jrfwsClient.onopen = async () => {
        console.log('open');
        await sendMes();
    };

    /// routing before start client
    /// step 1
    await jrfwsClient.route(async (data, stop) => {
        /// any code
        /// for stop next routing: await stop();
        console.log('all route before routing');
        console.log(data.data);
    });

    /// start client after routing
    await jrfwsClient.startClient('ws://localhost:3003');

}

initClient();