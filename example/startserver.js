const JRFWS = require('./jrfws');
const jrfws = new JRFWS();

async function initServer() {

    /// routing before start server
    /// step 1
    await jrfws.route(async (data, stop) => {
        /// any code
        /// for stop next routing: await stop();
        data.steps = 'step1; ';
        console.log('all route before routing');
    });

    /// step 2
    await jrfws.route('users', async (data, stop) => {
        /// any code
        /// for stop next routing: await stop();
        data.steps += 'step2; ';
        console.log('route with route: users or users. or users/');
    });

    /// step 3
    await jrfws.route('users', 'add', async (data, stop) => {
        /// any code
        /// for stop next routing: await stop();
        data.steps += 'step3; ';
        console.log('route with route: user and act: add');
    });

    /// step 4
    await jrfws.route('users.roles', async (data, stop) => {
        /// any code
        /// for stop next routing: await stop();
        data.steps += 'step4; ';
        console.log('route with route: users.roles or users/roles or users.roles. or users/roles/');
    });

    /// step 5
    await jrfws.route('users.roles', 'add', async (data, stop) => {
        /// any code
        /// for stop next routing: await stop();
        data.steps += 'step5; ';
        console.log('route with route: users.roles or users/roles and act: add');
    });

    /// step 6
    await jrfws.route(async (data, stop) => {
        /// any code
        /// for stop next routing: await stop();
        data.steps += 'step6; ';
        await data.client.sendMes(data.steps);
        console.log('all route after routing');
    });

    /// step 7
    await jrfws.route('not found', async (data, stop) => {
        /// any code
        data.steps += 'step7; ';
        await data.client.sendMes(data.steps);
        console.log('route not found');
    });

    /// start server after routing
    let opt = {
        port: 3003
    };
    /// default port: 3001
    await jrfws.startServer(opt);
}

initServer();

