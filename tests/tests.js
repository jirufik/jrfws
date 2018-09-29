const JRFWS = require('../jrfws');
const jrfwsSrv = new JRFWS();
const jrfwsClient1 = new JRFWS();
const jrfwsClient2 = new JRFWS();

let glObj = {
    countValid: 0,
    countInvalid: 0,
    break: false,
    isValid: false,
    isValidClient1: false,
    isValidClient2: false,
    data: null
};

async function resetIsValid(nameValid = '') {
    glObj['isValid' + nameValid] = false;
}

function isValid(nameValid = '', count = 0) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(new Promise(resolve => {
                if (glObj['isValid' + nameValid]) {
                    resolve(true);
                }

                if (count < 20 && !glObj['isValid' + nameValid]) {
                    count++;
                    resolve(isValid(nameValid, count));
                } else {
                    resolve(false);
                }
            }));
        }, 200);
    });
}

async function resetRoute(nameClient = '') {

    glObj[`notFound${nameClient}`] = false;
    glObj[`beforeRoute${nameClient}`] = false;
    glObj[`routeMorty${nameClient}`] = false;
    glObj[`routeMortyAdd${nameClient}`] = false;
    glObj[`routeRick${nameClient}`] = false;
    glObj[`routeRickAdd${nameClient}`] = false;
    glObj[`afterRoute${nameClient}`] = false;
    glObj[`data${nameClient}`] = null;

}

async function resetCompare(obj) {

    obj.compareRoute = '^_route_$|^_route_\\/|^_route_\\.';
    obj.compareAct = '^_act_$';

}

let tests = {

    async createServer(key) {

        try {
            await jrfwsSrv.startServer({port: 8011});
        } catch (e) {
            glObj.countInvalid++;
            console.log(`invalid test ${key}`);
            return;
        }

        glObj.countValid++;

    },

    async routeInvalidCompareRoute(key) {

        ///--- head ---
        let okay = true;
        await resetCompare(jrfwsSrv);

        ///--- body ---

        jrfwsSrv.compareRoute = 74997;
        let compare = await jrfwsSrv._getCompare(null, 'xxx');
        okay = compare.toString() === '/^xxx$|^xxx\\/|^xxx\\./';

        ///--- footer ---

        if (okay) {
            glObj.countValid++;
            return;
        }

        glObj.countInvalid++;
        console.log(`invalid test ${key}`);

    },

    async routeValidCompareRoute(key) {

        ///--- head ---
        let okay = true;
        await resetCompare(jrfwsSrv);

        ///--- body ---

        jrfwsSrv.compareRoute = '^_route_$|^_route_\\/';
        let compare = await jrfwsSrv._getCompare('route', 'xxx');
        okay = compare.toString() === '/^xxx$|^xxx\\//';

        ///--- footer ---

        if (okay) {
            glObj.countValid++;
            return;
        }

        glObj.countInvalid++;
        console.log(`invalid test ${key}`);

    },

    async routeInvalidCompareAct(key) {

        ///--- head ---
        let okay = true;
        await resetCompare(jrfwsSrv);

        ///--- body ---

        jrfwsSrv.compareAct = 74997;
        let compare = await jrfwsSrv._getCompare('act', 'xxx');
        okay = compare.toString() === '/^xxx$/';

        ///--- footer ---

        if (okay) {
            glObj.countValid++;
            return;
        }

        glObj.countInvalid++;
        console.log(`invalid test ${key}`);

    },

    async routeValidCompareAct(key) {

        ///--- head ---
        let okay = true;
        await resetCompare(jrfwsSrv);

        ///--- body ---

        jrfwsSrv.compareAct = '^_act_$|^_act_\\/';
        let compare = await jrfwsSrv._getCompare('act', 'xxx');
        okay = compare.toString() === '/^xxx$|^xxx\\//';
        await resetCompare(jrfwsSrv);

        ///--- footer ---

        if (okay) {
            glObj.countValid++;
            return;
        }

        glObj.countInvalid++;
        console.log(`invalid test ${key}`);

    },

    async testCompare(key) {

        ///--- head ---
        let okay = true;

        ///--- body ---

        let route = 'groupRick';
        let act = 'add';

        let compare = await jrfwsSrv._getCompare('route', route);
        okay = compare.test('groupRick');

        if (okay) {
            compare = await jrfwsSrv._getCompare('route', route);
            okay = compare.test('groupRick/');
        }

        if (okay) {
            compare = await jrfwsSrv._getCompare('route', route);
            okay = compare.test('groupRick/users');
        }

        if (okay) {
            compare = await jrfwsSrv._getCompare('route', route);
            okay = compare.test('groupRick.');
        }

        if (okay) {
            compare = await jrfwsSrv._getCompare('route', route);
            okay = compare.test('groupRick.users');
        }

        if (okay) {
            compare = await jrfwsSrv._getCompare('route', route);
            okay = !compare.test('groupRickUsers');
        }

        if (okay) {
            compare = await jrfwsSrv._getCompare('route', route);
            okay = !compare.test('groupRickUsers.groupRick');
        }

        if (okay) {
            compare = await jrfwsSrv._getCompare('route', 'groups.users');
            okay = compare.test('groups.users');
        }

        if (okay) {
            compare = await jrfwsSrv._getCompare('act', act);
            okay = compare.test('add');
        }

        if (okay) {
            compare = await jrfwsSrv._getCompare('act', act);
            okay = !compare.test('ad');
        }

        if (okay) {
            compare = await jrfwsSrv._getCompare('act', act);
            okay = !compare.test('addd');
        }

        if (okay) {
            compare = await jrfwsSrv._getCompare('act', act);
            okay = !compare.test('aadd');
        }

        if (okay) {
            compare = await jrfwsSrv._getCompare('act', act);
            okay = !compare.test('a add');
        }

        ///--- footer ---

        if (okay) {
            glObj.countValid++;
            return;
        }

        glObj.countInvalid++;
        console.log(`invalid test ${key}`);

    },

    async createRoutes(key) {

        await resetRoute();
        let okay = true;

        await jrfwsSrv.route('not found', async (data, stop) => {
            glObj.notFound = true;
            // glObj.isValid = true;
            if (data) {
                glObj.data = data.data;
                if (data.data.stop) {
                    glObj.isValid = true;
                    stop();
                }
            }
        });

        await jrfwsSrv.route(async (data, stop) => {
            // console.log(data);
            glObj.beforeRoute = true;
            // glObj.isValid = true;
            if (data) {
                glObj.data = data.data;
                // if (data.data.stop) {
                //     glObj.isValid = true;
                //     stop();
                // }
            }
        });

        await jrfwsSrv.route('morty', async (data, stop) => {
            glObj.routeMorty = true;
            // glObj.isValid = true;
            if (data) {
                glObj.data = data.data;
                if (data.data.stop) {
                    glObj.isValid = true;
                    stop();
                }
            }
        });

        await jrfwsSrv.route('morty', 'add', async (data, stop) => {
            glObj.routeMortyAdd = true;
            // glObj.isValid = true;
            if (data) {
                glObj.data = data.data;
                if (data.data.stop) {
                    glObj.isValid = true;
                    stop();
                }
            }
        });

        await jrfwsSrv.route('rick', async (data, stop) => {
            glObj.routeRick = true;
            // glObj.isValid = true;
            if (data) {
                glObj.data = data.data;
                if (data.data.stop) {
                    glObj.isValid = true;
                    stop();
                }
            }
        });

        await jrfwsSrv.route('rick', 'add', async (data, stop) => {
            glObj.routeRickAdd = true;
            // glObj.isValid = true;
            if (data) {
                glObj.data = data.data;
                if (data.data.stop) {
                    glObj.isValid = true;
                    stop();
                }
            }
        });

        await jrfwsSrv.route(async (data, stop) => {
            glObj.afterRoute = true;
            glObj.isValid = true;
            if (data) {
                glObj.data = data.data;
                if (data.data && data.data.stop) {
                    glObj.isValid = true;
                    stop();
                }
            }
        });

        if (jrfwsSrv._routes.length !== 6) {
            okay = false;
        }

        if (!jrfwsSrv._routeNotFound) {
            okay = false;
        }

        if (typeof jrfwsSrv._routeNotFound !== 'function') {
            okay = false;
        }

        if (okay) {
            glObj.countValid++;
            return;
        }

        glObj.countInvalid++;
        console.log(`invalid test ${key}`);

    },

    async validRouting(key) {

        let okay = true;

        await jrfwsSrv._routes[0].fn();
        await jrfwsSrv._routes[2].fn();
        await jrfwsSrv._routes[5].fn();

        if (glObj.notFound) {
            okay = false;
        }

        if (!glObj.beforeRoute) {
            okay = false;
        }

        if (glObj.routeMorty) {
            okay = false;
        }

        if (!glObj.routeMortyAdd) {
            okay = false;
        }

        if (glObj.routeRick) {
            okay = false;
        }

        if (glObj.routeRickAdd) {
            okay = false;
        }

        if (!glObj.afterRoute) {
            okay = false;
        }

        if (okay) {
            glObj.countValid++;
            return;
        }

        glObj.countInvalid++;
        console.log(`invalid test ${key}`);

    },

    async connectClient1(key) {

        let okay = true;

        await jrfwsClient1.startClient('ws://localhost:8011');
        jrfwsClient1.onopen = async () => {
            glObj.connecClient1 = true;
            glObj.isValid = true;
        };

        jrfwsClient1.onclose = async () => {
            if (glObj.countReconnectClient1) {
                glObj.countReconnectClient1++;
            } else {
                glObj.countReconnectClient1 = 1;
            }
        };

        okay = await isValid();
        if (!glObj.connecClient1) {
            okay = false;
        }

        if (okay) {
            glObj.countValid++;
            return;
        }

        glObj.countInvalid++;
        console.log(`invalid test ${key}`);

    },

    async connectClient2(key) {

        let okay = true;
        await resetIsValid();

        await jrfwsClient2.startClient('ws://localhost:8011');
        jrfwsClient2.onopen = async () => {
            glObj.connecClient2 = true;
            glObj.isValid = true;
        };

        jrfwsClient2.onclose = async () => {
            if (glObj.countReconnectClient2) {
                glObj.countReconnectClient2++;
            } else {
                glObj.countReconnectClient2 = 1;
            }
        };

        okay = await isValid();
        if (!glObj.connecClient2) {
            okay = false;
        }

        if (okay) {
            glObj.countValid++;
            return;
        }

        glObj.countInvalid++;
        console.log(`invalid test ${key}`);

    },

    async routeRickClient1(key) {

        ///--- head ---
        let okay = true;

        await resetRoute();
        await resetIsValid();

        await jrfwsClient1.sendMes('rick do it', 'rick');
        okay = await isValid();

        ///--- body ---

        if (glObj.notFound) {
            okay = false;
        }

        if (!glObj.beforeRoute) {
            okay = false;
        }

        if (glObj.routeMorty) {
            okay = false;
        }

        if (glObj.routeMortyAdd) {
            okay = false;
        }

        if (!glObj.routeRick) {
            okay = false;
        }

        if (glObj.routeRickAdd) {
            okay = false;
        }

        if (!glObj.afterRoute) {
            okay = false;
        }

        if (glObj.data !== 'rick do it') {
            okay = false;
        }

        ///--- footer ---

        if (okay) {
            glObj.countValid++;
            return;
        }

        glObj.countInvalid++;
        console.log(`invalid test ${key}`);

    },

    async routeMortyAddClient2(key) {

        ///--- head ---
        let okay = true;

        await resetRoute();
        await resetIsValid();

        await jrfwsClient2.sendMes('morty do it', 'morty', 'add');
        okay = await isValid();

        ///--- body ---

        if (glObj.notFound) {
            okay = false;
        }

        if (!glObj.beforeRoute) {
            okay = false;
        }

        if (!glObj.routeMorty) {
            okay = false;
        }

        if (!glObj.routeMortyAdd) {
            okay = false;
        }

        if (glObj.routeRick) {
            okay = false;
        }

        if (glObj.routeRickAdd) {
            okay = false;
        }

        if (!glObj.afterRoute) {
            okay = false;
        }

        if (glObj.data !== 'morty do it') {
            okay = false;
        }

        ///--- footer ---

        if (okay) {
            glObj.countValid++;
            return;
        }

        glObj.countInvalid++;
        console.log(`invalid test ${key}`);

    },

    async routeOnlyMesClient1(key) {

        ///--- head ---
        let okay = true;

        await resetRoute();
        await resetIsValid();

        await jrfwsClient1.sendMes('you do it');
        okay = await isValid();

        ///--- body ---

        if (glObj.notFound) {
            okay = false;
        }

        if (!glObj.beforeRoute) {
            okay = false;
        }

        if (glObj.routeMorty) {
            okay = false;
        }

        if (glObj.routeMortyAdd) {
            okay = false;
        }

        if (glObj.routeRick) {
            okay = false;
        }

        if (glObj.routeRickAdd) {
            okay = false;
        }

        if (!glObj.afterRoute) {
            okay = false;
        }

        if (glObj.data !== 'you do it') {
            okay = false;
        }

        ///--- footer ---

        if (okay) {
            glObj.countValid++;
            return;
        }

        glObj.countInvalid++;
        console.log(`invalid test ${key}`);

    },

    async routeNotFoundClient1(key) {

        ///--- head ---
        let okay = true;

        await resetRoute();
        await resetIsValid();

        await jrfwsClient1.sendMes('not found', 'black whole');
        okay = await isValid();

        ///--- body ---

        if (!glObj.notFound) {
            okay = false;
        }

        if (!glObj.beforeRoute) {
            okay = false;
        }

        if (glObj.routeMorty) {
            okay = false;
        }

        if (glObj.routeMortyAdd) {
            okay = false;
        }

        if (glObj.routeRick) {
            okay = false;
        }

        if (glObj.routeRickAdd) {
            okay = false;
        }

        if (!glObj.afterRoute) {
            okay = false;
        }

        if (glObj.data !== 'not found') {
            okay = false;
        }

        ///--- footer ---

        if (okay) {
            glObj.countValid++;
            return;
        }

        glObj.countInvalid++;
        console.log(`invalid test ${key}`);

    },

    async routeStopClient1(key) {

        ///--- head ---
        let okay = true;

        await resetRoute();
        await resetIsValid();

        await jrfwsClient1.sendMes({stop: true}, 'rick', 'add');
        okay = await isValid();

        ///--- body ---

        if (glObj.notFound) {
            okay = false;
        }

        if (!glObj.beforeRoute) {
            okay = false;
        }

        if (glObj.routeMorty) {
            okay = false;
        }

        if (glObj.routeMortyAdd) {
            okay = false;
        }

        if (!glObj.routeRick) {
            okay = false;
        }

        if (glObj.routeRickAdd) {
            okay = false;
        }

        if (glObj.afterRoute) {
            okay = false;
        }

        if (!glObj.data.stop) {
            okay = false;
        }

        ///--- footer ---

        if (okay) {
            glObj.countValid++;
            return;
        }

        glObj.countInvalid++;
        console.log(`invalid test ${key}`);

    },

    async createRoutesClient1(key) {

        await resetRoute('Client1');
        let okay = true;

        await jrfwsClient1.route('not found', async (data, stop) => {
            glObj.notFoundClient1 = true;
            // glObj.isValidClient1 = true;
            if (data) {
                glObj.dataClient1 = data.data;
                if (data.data.stop) {
                    glObj.isValidClient1 = true;
                    stop();
                }
            }
        });

        await jrfwsClient1.route(async (data, stop) => {
            // console.log(data);
            glObj.beforeRouteClient1 = true;
            // glObj.isValidClient1 = true;
            if (data) {
                glObj.dataClient1 = data.data;
                // if (data.data.stop) {
                //     glObj.isValidClient1 = true;
                //     stop();
                // }
            }
        });

        await jrfwsClient1.route('morty', async (data, stop) => {
            glObj.routeMortyClient1 = true;
            // glObj.isValidClient1 = true;
            if (data) {
                glObj.dataClient1 = data.data;
                if (data.data.stop) {
                    glObj.isValidClient1 = true;
                    stop();
                }
            }
        });

        await jrfwsClient1.route('morty', 'add', async (data, stop) => {
            glObj.routeMortyAddClient1 = true;
            // glObj.isValidClient1 = true;
            if (data) {
                glObj.dataClient1 = data.data;
                if (data.data.stop) {
                    glObj.isValidClient1 = true;
                    stop();
                }
            }
        });

        await jrfwsClient1.route('rick', async (data, stop) => {
            glObj.routeRickClient1 = true;
            // glObj.isValidClient1 = true;
            if (data) {
                glObj.dataClient1 = data.data;
                if (data.data.stop) {
                    glObj.isValidClient1 = true;
                    stop();
                }
            }
        });

        await jrfwsClient1.route('rick', 'add', async (data, stop) => {
            glObj.routeRickAddClient1 = true;
            // glObj.isValidClient1 = true;
            if (data) {
                glObj.dataClient1 = data.data;
                if (data.data.stop) {
                    glObj.isValidClient1 = true;
                    stop();
                }
            }
        });

        await jrfwsClient1.route(async (data, stop) => {
            glObj.afterRouteClient1 = true;
            glObj.isValidClient1 = true;
            if (data) {
                glObj.dataClient1 = data.data;
                if (data.data.stop) {
                    glObj.isValidClient1 = true;
                    stop();
                }
            }
        });

        if (jrfwsClient1._routes.length !== 6) {
            okay = false;
        }

        if (!jrfwsClient1._routeNotFound) {
            okay = false;
        }

        if (typeof jrfwsClient1._routeNotFound !== 'function') {
            okay = false;
        }

        if (okay) {
            glObj.countValid++;
            return;
        }

        glObj.countInvalid++;
        console.log(`invalid test ${key}`);

    },

    async createRoutesClient2(key) {

        await resetRoute('Client2');
        let okay = true;

        await jrfwsClient2.route('not found', async (data, stop) => {
            glObj.notFoundClient2 = true;
            // glObj.isValidClient2 = true;
            if (data) {
                glObj.dataClient2 = data.data;
                if (data.data.stop) {
                    glObj.isValidClient2 = true;
                    stop();
                }
            }
        });

        await jrfwsClient2.route(async (data, stop) => {
            // console.log(data);
            glObj.beforeRouteClient2 = true;
            // glObj.isValidClient2 = true;
            if (data) {
                glObj.dataClient2 = data.data;
                // if (data.data.stop) {
                //     glObj.isValidClient2 = true;
                //     stop();
                // }
            }
        });

        await jrfwsClient2.route('morty', async (data, stop) => {
            glObj.routeMortyClient2 = true;
            // glObj.isValidClient2 = true;
            if (data) {
                glObj.dataClient2 = data.data;
                if (data.data.stop) {
                    glObj.isValidClient2 = true;
                    stop();
                }
            }
        });

        await jrfwsClient2.route('morty', 'add', async (data, stop) => {
            glObj.routeMortyAddClient2 = true;
            // glObj.isValidClient2 = true;
            if (data) {
                glObj.dataClient2 = data.data;
                if (data.data.stop) {
                    glObj.isValidClient2 = true;
                    stop();
                }
            }
        });

        await jrfwsClient2.route('rick', async (data, stop) => {
            glObj.routeRickClient2 = true;
            // glObj.isValidClient2 = true;
            if (data) {
                glObj.dataClient2 = data.data;
                if (data.data.stop) {
                    glObj.isValidClient2 = true;
                    stop();
                }
            }
        });

        await jrfwsClient2.route('rick', 'add', async (data, stop) => {
            glObj.routeRickAddClient2 = true;
            // glObj.isValidClient2 = true;
            if (data) {
                glObj.dataClient2 = data.data;
                if (data.data.stop) {
                    glObj.isValidClient2 = true;
                    stop();
                }
            }
        });

        await jrfwsClient2.route(async (data, stop) => {
            glObj.afterRouteClient2 = true;
            glObj.isValidClient2 = true;
            if (data) {
                glObj.dataClient2 = data.data;
                if (data.data.stop) {
                    glObj.isValidClient2 = true;
                    stop();
                }
            }
        });

        if (jrfwsClient2._routes.length !== 6) {
            okay = false;
        }

        if (!jrfwsClient2._routeNotFound) {
            okay = false;
        }

        if (typeof jrfwsClient2._routeNotFound !== 'function') {
            okay = false;
        }

        if (okay) {
            glObj.countValid++;
            return;
        }

        glObj.countInvalid++;
        console.log(`invalid test ${key}`);

    },

    async routeMortyAddBroadcast(key) {

        ///--- head ---
        let okay = true;

        await resetRoute('Client1');
        await resetRoute('Client2');
        await resetIsValid('Client1');
        await resetIsValid('Client2');

        await jrfwsSrv.broadcast('all', 'morty do it', 'morty', 'add');
        okay = await isValid('Client1');
        okay = await isValid('Client2');

        ///--- body ---

        if (glObj.notFoundClient1) {
            okay = false;
        }

        if (glObj.notFoundClient2) {
            okay = false;
        }

        if (!glObj.beforeRouteClient1) {
            okay = false;
        }

        if (!glObj.beforeRouteClient2) {
            okay = false;
        }

        if (!glObj.routeMortyClient1) {
            okay = false;
        }

        if (!glObj.routeMortyClient2) {
            okay = false;
        }

        if (!glObj.routeMortyAddClient1) {
            okay = false;
        }

        if (!glObj.routeMortyAddClient2) {
            okay = false;
        }

        if (glObj.routeRickClient1) {
            okay = false;
        }

        if (glObj.routeRickClient2) {
            okay = false;
        }

        if (glObj.routeRickAddClient1) {
            okay = false;
        }

        if (glObj.routeRickAddClient2) {
            okay = false;
        }

        if (!glObj.afterRouteClient1) {
            okay = false;
        }

        if (!glObj.afterRouteClient2) {
            okay = false;
        }

        if (glObj.dataClient1 !== 'morty do it') {
            okay = false;
        }

        if (glObj.dataClient2 !== 'morty do it') {
            okay = false;
        }
        ///--- footer ---

        if (okay) {
            glObj.countValid++;
            return;
        }

        glObj.countInvalid++;
        console.log(`invalid test ${key}`);

    },

    async createBroadcastGroups(key) {

        ///--- head ---
        let okay = true;

        await resetRoute();
        await resetRoute('Client1');
        await resetRoute('Client2');
        await resetIsValid();
        await resetIsValid('Client1');
        await resetIsValid('Client2');


        ///--- body ---
        await jrfwsSrv.addGroup('RickAndMorty');
        await jrfwsSrv.addGroup('Rick');
        await jrfwsSrv.addGroup('Morty');

        if (!jrfwsSrv._groups.RickAndMorty) {
            okay = false;
        }

        if (!jrfwsSrv._groups.Rick) {
            okay = false;
        }

        if (!jrfwsSrv._groups.Morty) {
            okay = false;
        }

        ///--- footer ---

        if (okay) {
            glObj.countValid++;
            return;
        }

        glObj.countInvalid++;
        console.log(`invalid test ${key}`);

    },

    async fillGroupRickAndMorty(key) {

        ///--- head ---
        let okay = true;

        await resetRoute();
        await resetRoute('Client1');
        await resetRoute('Client2');
        await resetIsValid();
        await resetIsValid('Client1');
        await resetIsValid('Client2');


        ///--- body ---

        await jrfwsSrv.route('groupRickAndMorty', 'add', async (data, stop) => {
            await jrfwsSrv.addClientToGroup('RickAndMorty', data.client);
            glObj.isValid = true;
        });

        await jrfwsSrv.route('groupRickAndMorty', 'del', async (data, stop) => {
            await jrfwsSrv.delClientFromGroup('RickAndMorty', data.client);
            glObj.isValid = true;
        });

        await jrfwsSrv.route('groupRick', 'add', async (data, stop) => {
            await jrfwsSrv.addClientToGroup('Rick', data.client);
            glObj.isValid = true;
        });

        await jrfwsSrv.route('groupMorty', 'add', async (data, stop) => {
            await jrfwsSrv.addClientToGroup('Morty', data.client);
            glObj.isValid = true;
        });

        await jrfwsClient1.sendMes(null, 'groupRickAndMorty', 'add');
        okay = await isValid();
        await resetIsValid();

        await jrfwsClient2.sendMes(null, 'groupRickAndMorty', 'add');
        okay = await isValid();

        if (jrfwsSrv._groups.RickAndMorty.length !== 2) {
            okay = false;
        }

        ///--- footer ---

        if (okay) {
            glObj.countValid++;
            return;
        }

        glObj.countInvalid++;
        console.log(`invalid test ${key}`);

    },

    async fillGroupRick(key) {

        ///--- head ---
        let okay = true;

        await resetRoute();
        await resetRoute('Client1');
        await resetRoute('Client2');
        await resetIsValid();
        await resetIsValid('Client1');
        await resetIsValid('Client2');


        ///--- body ---
        await jrfwsClient1.sendMes(null, 'groupRick', 'add');
        okay = await isValid();

        if (jrfwsSrv._groups.Rick.length !== 1) {
            okay = false;
        }

        ///--- footer ---

        if (okay) {
            glObj.countValid++;
            return;
        }

        glObj.countInvalid++;
        console.log(`invalid test ${key}`);

    },

    async fillGroupMorty(key) {

        ///--- head ---
        let okay = true;

        await resetRoute();
        await resetRoute('Client1');
        await resetRoute('Client2');
        await resetIsValid();
        await resetIsValid('Client1');
        await resetIsValid('Client2');


        ///--- body ---
        await jrfwsClient2.sendMes(null, 'groupMorty', 'add');
        okay = await isValid();

        if (jrfwsSrv._groups.Morty.length !== 1) {
            okay = false;
        }

        ///--- footer ---

        if (okay) {
            glObj.countValid++;
            return;
        }

        glObj.countInvalid++;
        console.log(`invalid test ${key}`);

    },

    async routeMortyAddGroupRickAndMorty(key) {

        ///--- head ---
        let okay = true;

        await resetRoute();
        await resetRoute('Client1');
        await resetRoute('Client2');
        await resetIsValid();
        await resetIsValid('Client1');
        await resetIsValid('Client2');

        await jrfwsSrv.broadcast('RickAndMorty', 'morty do it', 'morty', 'add');
        okay = await isValid('Client1');
        okay = await isValid('Client2');

        ///--- body ---

        if (glObj.notFoundClient1) {
            okay = false;
        }

        if (glObj.notFoundClient2) {
            okay = false;
        }

        if (!glObj.beforeRouteClient1) {
            okay = false;
        }

        if (!glObj.beforeRouteClient2) {
            okay = false;
        }

        if (!glObj.routeMortyClient1) {
            okay = false;
        }

        if (!glObj.routeMortyClient2) {
            okay = false;
        }

        if (!glObj.routeMortyAddClient1) {
            okay = false;
        }

        if (!glObj.routeMortyAddClient2) {
            okay = false;
        }

        if (glObj.routeRickClient1) {
            okay = false;
        }

        if (glObj.routeRickClient2) {
            okay = false;
        }

        if (glObj.routeRickAddClient1) {
            okay = false;
        }

        if (glObj.routeRickAddClient2) {
            okay = false;
        }

        if (!glObj.afterRouteClient1) {
            okay = false;
        }

        if (!glObj.afterRouteClient2) {
            okay = false;
        }

        if (glObj.dataClient1 !== 'morty do it') {
            okay = false;
        }

        if (glObj.dataClient2 !== 'morty do it') {
            okay = false;
        }
        ///--- footer ---

        if (okay) {
            glObj.countValid++;
            return;
        }

        glObj.countInvalid++;
        console.log(`invalid test ${key}`);

    },

    async routeMortyAddGroupRickAndMortyExceptClient2(key) {

        ///--- head ---
        let okay = true;

        await resetRoute();
        await resetRoute('Client1');
        await resetRoute('Client2');
        await resetIsValid();
        await resetIsValid('Client1');
        await resetIsValid('Client2');

        let except = jrfwsSrv._groups.RickAndMorty[1];
        await jrfwsSrv.broadcastExcept('RickAndMorty', except, 'morty do it', 'morty', 'add');
        okay = await isValid('Client1');
        // okay = await isValid('Client2');

        ///--- body ---

        if (glObj.notFoundClient1) {
            okay = false;
        }

        if (glObj.notFoundClient2) {
            okay = false;
        }

        if (!glObj.beforeRouteClient1) {
            okay = false;
        }

        if (glObj.beforeRouteClient2) {
            okay = false;
        }

        if (!glObj.routeMortyClient1) {
            okay = false;
        }

        if (glObj.routeMortyClient2) {
            okay = false;
        }

        if (!glObj.routeMortyAddClient1) {
            okay = false;
        }

        if (glObj.routeMortyAddClient2) {
            okay = false;
        }

        if (glObj.routeRickClient1) {
            okay = false;
        }

        if (glObj.routeRickClient2) {
            okay = false;
        }

        if (glObj.routeRickAddClient1) {
            okay = false;
        }

        if (glObj.routeRickAddClient2) {
            okay = false;
        }

        if (!glObj.afterRouteClient1) {
            okay = false;
        }

        if (glObj.afterRouteClient2) {
            okay = false;
        }

        if (glObj.dataClient1 !== 'morty do it') {
            okay = false;
        }

        if (glObj.dataClient2) {
            okay = false;
        }
        ///--- footer ---

        if (okay) {
            glObj.countValid++;
            return;
        }

        glObj.countInvalid++;
        console.log(`invalid test ${key}`);

    },

    async routeMortyAddGroupRickAndMortyExceptArray(key) {

        ///--- head ---
        let okay = true;

        await resetRoute();
        await resetRoute('Client1');
        await resetRoute('Client2');
        await resetIsValid();
        await resetIsValid('Client1');
        await resetIsValid('Client2');

        let except = jrfwsSrv._groups.RickAndMorty;
        await jrfwsSrv.broadcastExcept('RickAndMorty', except, 'morty do it', 'morty', 'add');
        // okay = await isValid('Client1');
        // okay = await isValid('Client2');
        await wait(1000);

        ///--- body ---

        if (glObj.notFoundClient1) {
            okay = false;
        }

        if (glObj.notFoundClient2) {
            okay = false;
        }

        if (glObj.beforeRouteClient1) {
            okay = false;
        }

        if (glObj.beforeRouteClient2) {
            okay = false;
        }

        if (glObj.routeMortyClient1) {
            okay = false;
        }

        if (glObj.routeMortyClient2) {
            okay = false;
        }

        if (glObj.routeMortyAddClient1) {
            okay = false;
        }

        if (glObj.routeMortyAddClient2) {
            okay = false;
        }

        if (glObj.routeRickClient1) {
            okay = false;
        }

        if (glObj.routeRickClient2) {
            okay = false;
        }

        if (glObj.routeRickAddClient1) {
            okay = false;
        }

        if (glObj.routeRickAddClient2) {
            okay = false;
        }

        if (glObj.afterRouteClient1) {
            okay = false;
        }

        if (glObj.afterRouteClient2) {
            okay = false;
        }

        if (glObj.dataClient1) {
            okay = false;
        }

        if (glObj.dataClient2) {
            okay = false;
        }
        ///--- footer ---

        if (okay) {
            glObj.countValid++;
            return;
        }

        glObj.countInvalid++;
        console.log(`invalid test ${key}`);

    },

    async routeMortyAddGroupRick(key) {

        ///--- head ---
        let okay = true;

        await resetRoute();
        await resetRoute('Client1');
        await resetRoute('Client2');
        await resetIsValid();
        await resetIsValid('Client1');
        await resetIsValid('Client2');

        await jrfwsSrv.broadcast('Rick', 'morty do it', 'morty', 'add');
        okay = await isValid('Client1');

        ///--- body ---

        if (glObj.notFoundClient1) {
            okay = false;
        }

        if (glObj.notFoundClient2) {
            okay = false;
        }

        if (!glObj.beforeRouteClient1) {
            okay = false;
        }

        if (glObj.beforeRouteClient2) {
            okay = false;
        }

        if (!glObj.routeMortyClient1) {
            okay = false;
        }

        if (glObj.routeMortyClient2) {
            okay = false;
        }

        if (!glObj.routeMortyAddClient1) {
            okay = false;
        }

        if (glObj.routeMortyAddClient2) {
            okay = false;
        }

        if (glObj.routeRickClient1) {
            okay = false;
        }

        if (glObj.routeRickClient2) {
            okay = false;
        }

        if (glObj.routeRickAddClient1) {
            okay = false;
        }

        if (glObj.routeRickAddClient2) {
            okay = false;
        }

        if (!glObj.afterRouteClient1) {
            okay = false;
        }

        if (glObj.afterRouteClient2) {
            okay = false;
        }

        if (glObj.dataClient1 !== 'morty do it') {
            okay = false;
        }

        if (glObj.dataClient2) {
            okay = false;
        }
        ///--- footer ---

        if (okay) {
            glObj.countValid++;
            return;
        }

        glObj.countInvalid++;
        console.log(`invalid test ${key}`);

    },

    async routeMortyAddGroupMorty(key) {

        ///--- head ---
        let okay = true;

        await resetRoute();
        await resetRoute('Client1');
        await resetRoute('Client2');
        await resetIsValid();
        await resetIsValid('Client1');
        await resetIsValid('Client2');

        await jrfwsSrv.broadcast('Morty', 'morty do it', 'morty', 'add');
        okay = await isValid('Client2');

        ///--- body ---

        if (glObj.notFoundClient1) {
            okay = false;
        }

        if (glObj.notFoundClient2) {
            okay = false;
        }

        if (glObj.beforeRouteClient1) {
            okay = false;
        }

        if (!glObj.beforeRouteClient2) {
            okay = false;
        }

        if (glObj.routeMortyClient1) {
            okay = false;
        }

        if (!glObj.routeMortyClient2) {
            okay = false;
        }

        if (glObj.routeMortyAddClient1) {
            okay = false;
        }

        if (!glObj.routeMortyAddClient2) {
            okay = false;
        }

        if (glObj.routeRickClient1) {
            okay = false;
        }

        if (glObj.routeRickClient2) {
            okay = false;
        }

        if (glObj.routeRickAddClient1) {
            okay = false;
        }

        if (glObj.routeRickAddClient2) {
            okay = false;
        }

        if (glObj.afterRouteClient1) {
            okay = false;
        }

        if (!glObj.afterRouteClient2) {
            okay = false;
        }

        if (glObj.dataClient1) {
            okay = false;
        }

        if (glObj.dataClient2 !== 'morty do it') {
            okay = false;
        }
        ///--- footer ---

        if (okay) {
            glObj.countValid++;
            return;
        }

        glObj.countInvalid++;
        console.log(`invalid test ${key}`);

    },

    async groupRickAndMortyDelClient(key) {

        ///--- head ---
        let okay = true;

        await resetRoute();
        await resetRoute('Client1');
        await resetRoute('Client2');
        await resetIsValid();
        await resetIsValid('Client1');
        await resetIsValid('Client2');


        ///--- body ---
        await jrfwsClient2.sendMes(null, 'groupRickAndMorty', 'del');
        okay = await isValid();

        await resetRoute();
        await resetIsValid();

        await jrfwsSrv.broadcast('RickAndMorty', 'morty do it', 'morty', 'add');
        okay = await isValid('Client1');

        if (jrfwsSrv._groups.RickAndMorty.length !== 1) {
            okay = false;
        }

        if (glObj.notFoundClient1) {
            okay = false;
        }

        if (glObj.notFoundClient2) {
            okay = false;
        }

        if (!glObj.beforeRouteClient1) {
            okay = false;
        }

        if (glObj.beforeRouteClient2) {
            okay = false;
        }

        if (!glObj.routeMortyClient1) {
            okay = false;
        }

        if (glObj.routeMortyClient2) {
            okay = false;
        }

        if (!glObj.routeMortyAddClient1) {
            okay = false;
        }

        if (glObj.routeMortyAddClient2) {
            okay = false;
        }

        if (glObj.routeRickClient1) {
            okay = false;
        }

        if (glObj.routeRickClient2) {
            okay = false;
        }

        if (glObj.routeRickAddClient1) {
            okay = false;
        }

        if (glObj.routeRickAddClient2) {
            okay = false;
        }

        if (!glObj.afterRouteClient1) {
            okay = false;
        }

        if (glObj.afterRouteClient2) {
            okay = false;
        }

        if (glObj.dataClient1 !== 'morty do it') {
            okay = false;
        }

        if (glObj.dataClient2) {
            okay = false;
        }

        ///--- footer ---

        if (okay) {
            glObj.countValid++;
            return;
        }

        glObj.countInvalid++;
        console.log(`invalid test ${key}`);

    },

    async delBroadcastGroupRick(key) {

        ///--- head ---
        let okay = true;

        await resetRoute();
        await resetRoute('Client1');
        await resetRoute('Client2');
        await resetIsValid();
        await resetIsValid('Client1');
        await resetIsValid('Client2');


        ///--- body ---
        await jrfwsSrv.delGroup('Rick');

        if (!jrfwsSrv._groups.RickAndMorty) {
            okay = false;
        }

        if (jrfwsSrv._groups.Rick) {
            okay = false;
        }

        if (!jrfwsSrv._groups.Morty) {
            okay = false;
        }

        ///--- footer ---

        if (okay) {
            glObj.countValid++;
            return;
        }

        glObj.countInvalid++;
        console.log(`invalid test ${key}`);

    },

    async testGetRoute(key) {

        ///--- head ---
        let okay = true;
        let compare = [
            {
                route: 'morty',
                acts: [
                    'add'
                ]
            },
            {
                route: 'rick',
                acts: [
                    'add'
                ]
            },
            {
                route: 'groupRickAndMorty',
                acts: [
                    'add',
                    'del'
                ]
            },
            {
                route: 'groupRick',
                acts: [
                    'add'
                ]
            },
            {
                route: 'groupMorty',
                acts: [
                    'add'
                ]
            }
        ];

        ///--- body ---
        let routes = await jrfwsSrv.getRoutes();
        okay = JSON.stringify(routes) === JSON.stringify(compare);

        ///--- footer ---

        if (okay) {
            glObj.countValid++;
            return;
        }

        glObj.countInvalid++;
        console.log(`invalid test ${key}`);

    },

    async testReconnect(key) {

        ///--- head ---
        let okay = true;

        await jrfwsSrv.close();

        ///--- body ---
        await wait(3000);
        await jrfwsClient1.close();
        await jrfwsClient2.close();

        if (glObj.countReconnectClient1 < 2) {
            okay = false;
        }

        if (glObj.countReconnectClient2 < 2) {
            okay = false;
        }

        ///--- footer ---

        if (okay) {
            glObj.countValid++;
            return;
        }

        glObj.countInvalid++;
        console.log(`invalid test ${key}`);

    }

};

function wait(mlsecond = 1000) {
    return new Promise(resolve => setTimeout(resolve, mlsecond));
}

async function runTests() {

    for (let [key, value] of Object.entries(tests)) {
        if (glObj.break) {
            break;
        }
        await value(key);
    }

    // await jrfwsClient1.close();
    // await jrfwsClient2.close();
    // await jrfwsSrv.close();

    console.log(JSON.stringify(glObj, null, 4));
    console.log(`Count valid tests: ${glObj.countValid}`);
    console.log(`Count invalid tests: ${glObj.countInvalid}`);

}

runTests();
