﻿﻿# jrfws
  
#### Deprecated. New version [jrf-ws-3](https://github.com/jirufik/jrf-ws)  

**jrfws** is a **async/await** package for creating real-time **api**, based on **websockets**. Is a wrapper over easy and fast [ws](https://www.npmjs.com/package/ws). Can work independently or in conjunction with [koa](https://www.npmjs.com/package/koa).

![jrfwslogo](jrfwslogo.png)

* [Installation](#installation)
* [Start server](#startserver)
* [Start server with Koa](#startserverwithkoa)
* [Routing](#routing)
* [Start client](#startclient)
* [Webclient](#webclient)
* [Send message from client to server](#sendmestoserver)
* [Send message from server to client](#sendmestoclient)
* [Broadcast](#broadcasthead)
	* [All clients](#allclients)
	* [Add group](#addgroup)
	* [Del group](#delgroup)
	* [Add client to group](#addclienttogroup)
	* [Del client from group](#delclientfromgroup)
	* [Broadcast](#broadcast)
	* [Broadcast except client(s)](#broadcastexcept)
* [Get routes](#getroutes)	
* [Example](#example)

## [Installation](#installation)

    $ npm i jrfws --save
    
**jrfws**  - это **async/await** пакет для создания **api** реального времени, на основе **websockets**. Является оберткой над легким и быстрым [ws](https://www.npmjs.com/package/ws). Может работать самостоятельно или в связке с [koa](https://www.npmjs.com/package/koa). 
        
## [Start server](#startserver)

```js
const JRFWS = require('jrfws');  
const jrfws = new JRFWS();  
  
async function initServer() {

  /// any code	
  
  let opt = {  
  port: 3003  
  };  
  /// default port: 3001  
  await jrfws.startServer(opt);  
}  
  
initServer();
```

Более подробно про **opt** сервера можно прочитать из официальной документации [ws](https://github.com/websockets/ws/blob/master/doc/ws.md#new-websocketserveroptions-callback)

## [Start server with Koa](#startserverwithkoa)

```js
const Koa = require('koa');  
const JRFWS = require('jrfws');  
const app = new Koa();  
const jrfws = new JRFWS();

/// any code

/// http
jrfws.attach(app);
app.listen(3001);

/// or https
jrfws.attach(app, true, {
  key: fs.readFileSync(...),
  cert: fs.readFileSync(...),
  ca: fs.readFileSync(...)
});
app.listen(3001);

/// jrfws == app.jrfws ---> true
```

## [Routing](#routing)

Добавление **routing**а должно быть до запуска сервера.  Добавление происходит с помощью:

```js
await jrfws.route(route, act, func(data, stop));
```

| param | type | required | description |
|--|--|--|--|
| route | string |  | Путь |
| act | string |  | Действие относительно пути |
| func | function | true | Асинхронная функция принимающая: **data** - данные посланные сообщением, **stop** - асинхронная функция, вызов которой приостановит последующий routing |

**data** состоит из 

| param | type | description |
|--|--|--|
| data | any | Данные любого типа посланные с клиента |
| route | string | Путь посланный с клиента |
| act | string | Действие относительно пути посланное с клиента |
| client | object | Внутренний объект клиента **ws**, которому добавлен метод **sendMes(data, route, act)** для отправки сообщения ответа клиенту |

```js
const JRFWS = require('jrfws');  
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
    console.log('route with route: users.roles or users/roles  or users.roles. or users/roles/');  
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
```

## [Start client](#startclient)
```js
await jrfwsClient.startClient(url, reconnect);
```

| param | type | required | description |
|--|--|--|--|
| url | string | true | Строка подключения к серверу |
| reconnect | boolean |  | Подключаться к серверу автоматически при разрывах. Если параметр не задать, то по умолчанию true |

```js
const JRFWS = require('jrfws');  
const jrfwsClient = new JRFWS();  
  
async function initClient() {  
  await jrfwsClient.startClient('ws://localhost:3003');  
}  
  
initClient();
```

**Client** тоже поддерживает **routing**

**data** состоит из 

| param | type | description |
|--|--|--|
| data | any | Данные любого типа посланные с сервера |
| route | string | Путь посланный с сервера |
| act | string | Действие относительно пути посланное с сервера |

```js
const JRFWS = require('jrfws');  
const jrfwsClient = new JRFWS();  
  
async function initClient() {  

  /// routing before start client  
  /// step 1  
  await jrfwsClient.route(async (data, stop) => {  
  /// any code  
  /// for stop next routing: await stop();
    console.log('all route before routing');  
 });  
 
  /// start client after routing  
  await jrfwsClient.startClient('ws://localhost:3003');  
}  
  
initClient();
```

**Client** имеет события **onopen**, **onerror**, **onclose**, **onmessage**.

```js
jrfwsClient.onopen = async () => {  
  console.log('open');  
};
```

## [Webclient](#webclient)

**Webclient** может все что и **client**

```html
<script src="js/webclient.js"></script>
```

```js
let jrfws;  
  
document.addEventListener('DOMContentLoaded', start());  
  
async function start() {  
  
  jrfws = new JRFWS();  
  await routing();  
  await jrfws.connectToWs('ws://localhost:3003');  
  
}  
  
async function routing() {  
  
  await jrfws.route('users', 'login', async (data, stop) => {  
   if (!data.data.okay || !data.data.user) {  
   console.log('Invalid login');  
   stop();  
   return;  
 }
   await setChatUser(data.data.user);  
 });
 
} 
```

## [Send message from client to server](#sendmestoserver)

```js
/// Mes with data, route and act
await jrfwsClient.sendMes(data, route, act);

/// Mes with route and act
await jrfwsClient.sendMes(null, route, act);

/// Mes with route
await jrfwsClient.sendMes(null, route);

/// Mes with data
await jrfwsClient.sendMes(data);
```

| param | type | description |
|--|--|--|
| data | any | Данные любого типа |
| route | string | Путь |
| act | string | Действие относительно пути |

```js
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
```

## [Send message from server to client](#sendmestoclient)

```js
/// Mes with data, route and act
await data.client.sendMes(data, route, act);

/// Mes with route and act
await data.client.sendMes(null, route, act);

/// Mes with route
await data.client.sendMes(null, route);

/// Mes with data
await data.client.sendMes(data);
```

| param | type | description |
|--|--|--|
| data | any | Данные любого типа |
| route | string | Путь |
| act | string | Действие относительно пути |

```js
await jrfws.route('not found', async (data, stop) => {  
  /// any code  
  data.steps += 'step7; ';  
  await data.client.sendMes(data.steps);  
  console.log('route not found');  
});
```

## [Broadcast](#broadcasthead)

### [All clients](#allclients)

```js
jrfws.wss.clients /// array ws clients
```

### [Add group](#addgroup)

```js
await jrfws.addGroup(nameGroup);
```

| param | type | description |
|--|--|--|
| nameGroup | string | Имя группы, кроме all |

### [Del group](#delgroup)

```js
await jrfws.delGroup(nameGroup);
```

| param | type | description |
|--|--|--|
| nameGroup | string | Имя группы, кроме all |

### [Add client to group](#addclienttogroup)

```js
await jrfws.addClientToGroup(nameGroup, client);
```

| param | type | description |
|--|--|--|
| nameGroup | string | Имя группы |
| client | object | client type [ws](https://www.npmjs.com/package/ws#server-broadcast) data.client |

### [Del client from group](#delclientfromgroup)

```js
await jrfws.delClientFromGroup(nameGroup, client);
```

| param | type | description |
|--|--|--|
| nameGroup | string | Имя группы |
| client | object | client type [ws](https://www.npmjs.com/package/ws#server-broadcast) data.client |

### [Broadcast](#broadcast)

```js
await jrfws.broadcast(nameGroup, data, route, act);
```

| param | type | description |
|--|--|--|
| nameGroup | string | Имя группы. 'all' для всех jrfws.wss.clients |
| data | any | Данные любого типа |
| route | string | Путь |
| act | string | Действие относительно пути |

### [Broadcast except client(s)](#broadcastexcept)

```js
await jrfws.broadcastExcept(nameGroup, except, data, route, act);
```

| param | type | description |
|--|--|--|
| nameGroup | string | Имя группы. 'all' для всех jrfws.wss.clients |
| except | object or array | client(s) type [ws](https://www.npmjs.com/package/ws#server-broadcast) data.client |
| data | any | Данные любого типа |
| route | string | Путь |
| act | string | Действие относительно пути |

### [Get routes](#getroutes)

Получить все routes с acts

```js
let routes = await jrfws.getRoutes();

routes = [
            {
                route: 'users',
                acts: [
                    'add'
                ]
            },
            {
                route: 'users.roles',
                acts: [
                    'add'
                ]
            }
        ];
```

### [Example](#example)

 [Simplechat](https://github.com/jirufik/simplechat) is an example of using packages of **jrfws** and [jrfdb](https://github.com/jirufik/jrfdb) (odm mongodb).
 
 ![chat](chat.png)
