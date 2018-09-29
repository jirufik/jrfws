const WebSocket = require('ws');

module.exports = class JRFWS {

    constructor() {
        this.wss = null;
        this.__stop = false;
        this._routeNotFound = null;
        this._routes = [];
        this._groups = {};
        this.url = null;
        this.reconnect = true;
        this.wsClient = null;
        this.onopen = null;
        this.onerror = null;
        this.onclose = null;
        this.onmessage = null;
        this.compareRoute = '^_route_$|^_route_\\/|^_route_\\.';
        this.compareAct = '^_act_$';
    }

    _wait(mlsecond = 1000) {
        return new Promise(resolve => setTimeout(resolve, mlsecond));
    }

    async startClient(url, reconnect = true) {

        if (url && typeof url === 'string') {
            this.url = url;
        }

        if (typeof reconnect === 'boolean') {
            this.reconnect = reconnect;
        }

        this.wsClient = new WebSocket(this.url);

        this.wsClient.onopen = async () => {
            console.log('WebSocket connection established');
            if (this.onopen && typeof this.onopen === 'function') {
                await this.onopen();
            }
        };

        this.wsClient.onerror = async () => {
            console.log('WebSocket error');
            if (this.onerror && typeof this.onerror === 'function') {
                await this.onerror();
            }
        };

        this.wsClient.onclose = async () => {
            console.log('WebSocket connection closed');
            if (this.onclose && typeof this.onclose === 'function') {
                await this.onclose();
            }
            if (this.reconnect) {
                await this._wait(500);
                await this.reconnectToWs();
            }
        };

        this.wsClient.onmessage = async message => {
            if (this.onmessage && typeof this.onmessage === 'function') {
                await this.onmessage();
            }
            await this._routing(message.data);
        };

    }

    async reconnectToWs() {

        if (this.wsClient.readyState === 3 || this.wsClient.readyState === 2) {
            await this._wait(500);
            await this.startClient(this.url, this.reconnect);
        }
        else {
            console.log(this.wsClient.readyState);
        }
    }

    async close() {
        if (this.wsClient) {
            this.reconnect = false;
            this.wsClient.close();
        } else {
            this.wss.close();
        }
    }

    attach(app, https, opts) {

        let http = https ? require('https') : require('http');

        if (app.server && app.server.constructor.name != 'Server') {
            throw new Error('app.server already exists but it\'s not an http server');
        }

        if (!app.server) {
            // Create a server if it doesn't already exists
            app.server = https ? http.createServer(opts || {}, app.callback()) : http.createServer(app.callback());

            app.listen = function listen() {
                app.server.listen.apply(app.server, arguments);
                return app.server;
            }
        }

        this.wss = new WebSocket.Server({server: app.server});
        this.wss.routing = this._routing.bind(this);
        this.wss.sendMes = this.sendMes;
        this.wss.on('connection', this._connection);

        app.jrfws = this;
    }

    async startServer(opts) {
        this.wss = new WebSocket.Server(opts || {port: 3001});
        this.wss.routing = this._routing.bind(this);
        this.wss.sendMes = this.sendMes;
        this.wss.on('connection', this._connection);
    }

    _connection(ws) {

        ws.sendMes = async (data, route = null, act = null) => {
            return await this.sendMes(ws, data, route, act);
        };
        ws.onmessage = async (message) => {
            await this.routing(message.data, ws);
        }

    }

    async _routing(mes, ws) {

        let data = await this._parseMessage(mes);
        let stop = {
            stop: false
        };
        if (!data) {
            return;
        }

        if (ws) {
            data.client = ws;
        }

        let notFound = true;
        for (let el of this._routes) {

            if (stop.stop) {
                stop.stop = false;
                return;
            }

            let act = false;
            if (el.act) {

                let compare = await this._getCompare('act', el.act);

                if (!compare.test(data.act)) {
                    continue;
                }
                act = true;

            }

            if (el.route) {

                if (act) {
                    if (el.route !== data.route) {
                        continue;
                    }
                }

                let compare = await this._getCompare('route', el.route);

                if (!compare.test(data.route)) {
                    continue;
                }

            }

            if (el.route) {
                notFound = false;
            }

            await el.fn(data, await this._stop(stop));
        }

        if (data.route && notFound && typeof this._routeNotFound === 'function') {
            await this._routeNotFound(data, await this._stop(stop));
        }

    }

    async _getCompare(nameCompare = 'route', value = '_route_') {

        let strReplace = '_route_';
        if (nameCompare === 'act') {
            strReplace = '_act_';
        }

        if (strReplace === '_route_') {

            try {
                let compare = new RegExp(this.compareRoute.split(strReplace).join(value));
                return compare;
            } catch (e) {

            }

            return new RegExp('^_route_$|^_route_\\/|^_route_\\.'.split(strReplace).join(value));

        } else if (strReplace === '_act_') {

            try {
                let compare = new RegExp(this.compareAct.split(strReplace).join(value));
                return compare;
            } catch (e) {

            }

            return new RegExp('^_act_$'.split(strReplace).join(value));

        }

        return new RegExp('^_route_$|^_route_\\/|^_route_\\.'.split(strReplace).join(value));
    }

    async route(...opts) {

        if (!opts.length) {
            throw new Error('Invalid route');
        }

        if (opts.length > 3) {
            throw new Error('Invalid route');
        }

        let route = {};
        let indexFn = null;
        let countFn = 0;
        for (let i = 0; i < opts.length; i++) {
            if (typeof opts[i] === 'function') {
                indexFn = i;
                countFn++;
            }
        }

        if (countFn === 0 || countFn > 1) {
            throw new Error('Invalid route');
        }

        if (opts.length === 1) {

            route.fn = opts[0];

        } else if (opts.length === 2) {

            if (typeof opts[0] !== 'string') {
                throw new Error('Invalid route');
            }

            route.route = opts[0];
            route.fn = opts[1];

        } else if (opts.length === 3) {

            if (typeof opts[0] !== 'string') {
                throw new Error('Invalid route');
            }

            if (typeof opts[1] !== 'string') {
                throw new Error('Invalid route');
            }

            route.route = opts[0];
            route.act = opts[1];
            route.fn = opts[2];
        }

        if (route.route === 'not found') {
            this._routeNotFound = route.fn;
            return;
        }
        this._routes.push(route);

    }

    async _stop(self) {
        return async function () {
            self.stop = true;
        }
    }

    async _parseMessage(mes) {

        let data = mes;

        if (typeof data !== 'object') {

            try {
                data = JSON.parse(mes);
            } catch (err) {
                return false;
            }
        }

        if (!data.data && !data.route && !data.act) {
            return false;
        }

        if (data.route && typeof data.route !== 'string') {
            return false;
        }

        if (data.act && typeof data.act !== 'string') {
            return false;
        }

        return data;

    }

    async sendMes(client, data, route = null, act = null) {

        if (this.wsClient) {

            await this._sendMesClient(client, data, route);

        } else {

            try {

                if (!client) {
                    console.log('Not client');
                    return false;
                }

                if (!data && !route && !act) {
                    console.log('Not data');
                    return false;
                }

                let mes = {
                    route,
                    act,
                    data
                };

                client.send(JSON.stringify(mes));
                return true;

            } catch (e) {

            }


        }

        return false;

    }

    async _sendMesClient(data, route = null, act = null) {

        try {

            if (!this.wsClient) {
                return;
            }

            if (this.wsClient.readyState !== 1) {
                return;
            }

            if (!data && !route && !act) {
                console.log('Not data');
                return false;
            }

            let mes = {
                route,
                act,
                data
            };

            this.wsClient.send(JSON.stringify(mes));
            return true;

        } catch (e) {
            console.log(`Error sendMes ${e}`);
        }

        return false;

    }

    async addGroup(name) {

        if (!name) {
            return false;
        }

        if (typeof name !== 'string') {
            return false;
        }

        if (this._groups[name]) {
            return false;
        }

        this._groups[name] = [];
        return true;

    }

    async delGroup(name) {

        if (!name) {
            return false;
        }

        if (typeof name !== 'string') {
            return false;
        }

        if (!this._groups[name]) {
            return false;
        }

        delete this._groups[name];
        return true;

    }

    async addClientToGroup(group, client) {

        if (typeof client !== 'object') {
            return false;
        }

        if (!group) {
            return false;
        }

        if (typeof group !== 'string') {
            return false;
        }

        if (!this._groups[group]) {
            return false;
        }

        if (Array.isArray(client)) {
            for (let el of client) {
                if (typeof el !== 'object') {
                    continue;
                }
                this._groups[group].push(el);
            }
            return true;
        }

        this._groups[group].push(client);
        return true;

    }

    async delClientFromGroup(group, client) {

        if (typeof client !== 'object') {
            return false;
        }

        if (!group) {
            return false;
        }

        if (typeof group !== 'string') {
            return false;
        }

        if (!this._groups[group]) {
            return false;
        }

        let index = -1;
        if (Array.isArray(client)) {
            for (let el of client) {
                if (typeof el !== 'object') {
                    continue;
                }
                index = -1;
                index = this._groups[group].indexOf(client);
                if (index > -1) {
                    this._groups[group].splice(index);
                }
            }
            return true;
        }

        index = this._groups[group].indexOf(client);
        if (index > -1) {
            this._groups[group].splice(index);
        }
        return true;

    }

    async broadcast(group = 'all', data = null, route = null, act = null) {

        if (typeof group !== 'string') {
            return;
        }

        if (!data) {
            return;
        }

        if (route && typeof route !== 'string') {
            return;
        }

        if (act && typeof act !== 'string') {
            return;
        }

        if (group !== 'all') {

            if (typeof group !== 'string') {
                return;
            }
            if (!this._groups[group]) {
                return;
            }

            for (let client of this._groups[group]) {
                await client.sendMes(data, route, act);
            }

            return;

        }

        for (let client of this.wss.clients) {
            await client.sendMes(data, route, act);
        }

    }

    async broadcastExcept(group = 'all', except = null, data = null, route = null, act = null) {

        if (typeof group !== 'string') {
            return;
        }

        if (!except) {
            return;
        }

        if (!data) {
            return;
        }

        if (route && typeof route !== 'string') {
            return;
        }

        if (act && typeof act !== 'string') {
            return;
        }

        if (group !== 'all') {

            if (typeof group !== 'string') {
                return;
            }
            if (!this._groups[group]) {
                return;
            }

            for (let client of this._groups[group]) {

                if (Array.isArray(except)) {

                    if (except.indexOf(client) !== -1) {
                        continue;
                    }

                } else {

                    if (client === except) {
                        continue;
                    }

                }

                await client.sendMes(data, route, act);
            }

            return;

        }

        for (let client of this.wss.clients) {

            if (Array.isArray(except)) {

                if (except.indexOf(client) !== -1) {
                    continue;
                }

            } else {

                if (client === except) {
                    continue;
                }

            }
            await client.sendMes(data, route, act);
        }

    }

    async getRoutes() {

        let routes = [];
        for (let el of this._routes) {

            if (!el.route) {
                continue;
            }

            let route = {};
            for (let elRoute of routes) {
                if (elRoute.route === el.route) {
                    route = elRoute;
                    break;
                }
            }

            if (!route.route) {
                route.route = el.route;
                route.acts = [];
                routes.push(route);
            }

            if (!el.act) {
                continue;
            }

            if (route.acts.includes(el.act)) {
                continue;
            }

            route.acts.push(el.act);

        }

        return routes;

    }

};