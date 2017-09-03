'use strict';

const X32_UDP_PORT = 10023;

// Packages
const getPort = require('get-port');
const osc = require('osc');
const {ipcMain} = require('electron');
const log = require('electron-log');

const mixbusMutes = [];
let udpPort;
let broadcastPort;

module.exports = {
	async init(mainWindow) {
		for (let i = 0; i < 16; i++) {
			mixbusMutes[i] = new Array(32).fill(false);
		}

		udpPort = new osc.UDPPort({
			localAddress: '0.0.0.0',
			localPort: await getPort(),
			remotePort: X32_UDP_PORT,
			metadata: true
		});

		broadcastPort = new osc.UDPPort({
			localAddress: '0.0.0.0',
			localPort: await getPort(),
			remoteAddress: '192.168.1.255', // TODO: determine broadcast address
			remotePort: X32_UDP_PORT,
			broadcast: true,
			metadata: true
		});

		broadcastPort.on('message', () => {
			// console.log('got message:', message);
			// console.log('timeTag:', timeTag);
			// console.log('info:', info);
		});

		broadcastPort.on('error', error => {
			log.error('[broadcast] Error:', error.stack);
		});

		broadcastPort.open();

		setInterval(() => {
			broadcastPort.send({
				address: '/info'
			});
		}, 5000);

		udpPort.on('raw', buf => {
			const str = buf.toString('ascii');
			let valueBytes;

			if (str.indexOf(`/mixMutes/`) === 0) {
				const mixbusNumber = parseInt(str.match(/\d+/)[0], 10);
				if (typeof mixbusNumber !== 'number') {
					return;
				}

				// Start reading values from after the header
				valueBytes = buf.slice(buf.lastIndexOf(0x62) + 8);
				for (let c = 0; c < 32; c++) {
					mixbusMutes[mixbusNumber - 1][c] = Boolean(valueBytes.readFloatBE(c * 4));
				}
			}
		});

		setInterval(() => {
			try {
				mainWindow.webContents.send('x32-data', mixbusMutes);
			} catch (e) {
				if (e.message.startsWith('Object has been destroyed')) {
					// This happens when closing the program sometimes.
					return;
				}

				throw e;
			}
		}, 100);

		udpPort.on('error', error => {
			log.error('[osc] Error:', error.stack);
		});

		udpPort.on('open', () => {
			log.info('[osc] X32 port open');
		});

		udpPort.on('close', () => {
			log.info('[osc] X32 port closed');
		});

		// Open the socket.
		udpPort.open();

		renewSubscriptions();
		setInterval(renewSubscriptions, 10000);

		ipcMain.on('toggle', (event, {channel, mixbus}) => {
			if (!udpPortIsConfigured()) {
				return;
			}

			udpPort.send({
				address: `/ch/${toFixed2(channel)}/mix/${toFixed2(mixbus)}/on`,
				args: [
					{type: 's', value: mixbusMutes[mixbus][channel] ? 'OFF' : 'ON'}
				]
			});
		});
	},

	setIpPort(ip, port) {
		udpPort.options.remoteAddress = ip;
		udpPort.options.remotePort = port;
		renewSubscriptions();
	}
};

/**
 * Renews subscriptions with the X32 (they expire every 10s).
 * @returns {undefined}
 */
function renewSubscriptions() {
	if (!udpPortIsConfigured()) {
		return;
	}

	for (let m = 0; m < 16; m++) {
		const formattedM = toFixed2(m);
		udpPort.send({
			address: '/batchsubscribe',
			args: [
				{type: 's', value: `/mixMutes/${formattedM}`},
				{type: 's', value: `/mix/${formattedM}/on`},
				{type: 'i', value: 0},
				{type: 'i', value: 31},
				{type: 'i', value: 1}
			]
		});
	}
}

function toFixed2(num) {
	num += 1;
	return num < 10 ? `0${num}` : num;
}

function udpPortIsConfigured() {
	return udpPort && udpPort.options.remoteAddress && udpPort.options.remotePort;
}
