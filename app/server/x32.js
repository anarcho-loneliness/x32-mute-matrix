'use strict';

// Packages
const getPort = require('get-port');
const osc = require('osc');
const {ipcMain} = require('electron');
const log = require('electron-log');

const BLOB_START_OFFSET = 4;
const NAME_LEN_BYTES = 32;
const NUM_AUX_INS = 8;
const NUM_CHANNELS = 32;
const NUM_CHANNELS_AND_AUX_INS = NUM_CHANNELS + NUM_AUX_INS;
const NUM_MIXBUSES = 16;
const X32_UDP_PORT = 10023;
const COLOR_MAP = [
	'OFF',
	'RD',
	'GN',
	'YE',
	'BL',
	'MG',
	'CY',
	'WH',
	'OFFi',
	'RDi',
	'GNi',
	'YEi',
	'BLi',
	'MGi',
	'CYi',
	'WHi'
];

let udpPort;
let broadcastPort;
let mainWindow;
let mutesChangeWaiting = false;
let configsChangeWaiting = false;

const muteArrayProxyHandler = {
	set(target, prop, newVal) {
		if (target[prop] === newVal) {
			return true;
		}

		target[prop] = newVal;
		mutesChangeWaiting = true;
		return true;
	}
};

const channelConfigProxyHandler = {
	set(target, prop, newVal) {
		if (target[prop] === newVal) {
			return true;
		}

		target[prop] = newVal;
		configsChangeWaiting = true;
		return true;
	}
};

const mutes = {
	main: makeMutesArrayProxy(),
	mixbus01: makeMutesArrayProxy(),
	mixbus02: makeMutesArrayProxy(),
	mixbus03: makeMutesArrayProxy(),
	mixbus04: makeMutesArrayProxy(),
	mixbus05: makeMutesArrayProxy(),
	mixbus06: makeMutesArrayProxy(),
	mixbus07: makeMutesArrayProxy(),
	mixbus08: makeMutesArrayProxy(),
	mixbus09: makeMutesArrayProxy(),
	mixbus10: makeMutesArrayProxy(),
	mixbus11: makeMutesArrayProxy(),
	mixbus12: makeMutesArrayProxy(),
	mixbus13: makeMutesArrayProxy(),
	mixbus14: makeMutesArrayProxy(),
	mixbus15: makeMutesArrayProxy(),
	mixbus16: makeMutesArrayProxy(),
	mono: makeMutesArrayProxy()
};

const mutesKeyOrder = Object.keys(mutes);

const configs = {};
for (let c = 0; c < NUM_CHANNELS; c++) {
	const fixedC = toFixed2(c);
	const name = `channel${fixedC}`;
	configs[name] = makeConfigProxy({name, label: `Ch ${fixedC}`});
}
for (let a = 0; a < NUM_AUX_INS; a++) {
	const fixedA = toFixed2(a);
	const name = `auxin${fixedA}`;
	configs[name] = makeConfigProxy({name, label: `Aux ${fixedA}`});
}
for (let m = 0; m < NUM_MIXBUSES; m++) {
	const fixedM = toFixed2(m);
	const name = `mixbus${fixedM}`;
	configs[name] = makeConfigProxy({name, label: `Bus ${fixedM}`});
}

module.exports = {
	async init(mw) {
		mainWindow = mw;

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

		udpPort.on('message', oscBundle => {
			if (oscBundle.address === '/channelConfigs') {
				parseConfigs(Buffer.from(oscBundle.args[0].value), 'channel');
			} else if (oscBundle.address === '/mixbusConfigs') {
				parseConfigs(Buffer.from(oscBundle.args[0].value), 'mixbus');
			} else if (oscBundle.address === '/auxinConfigs') {
				parseConfigs(Buffer.from(oscBundle.args[0].value), 'auxin');
			} else if (oscBundle.address.startsWith('/mixMutes/')) {
				const busName = oscBundle.address.substr(10);
				const blob = Buffer.from(oscBundle.args[0].value);
				for (let channelNumber = 0; channelNumber < NUM_CHANNELS_AND_AUX_INS; channelNumber++) {
					const offset = BLOB_START_OFFSET + (channelNumber * 4);
					mutes[busName][channelNumber] = Boolean(blob.readInt32LE(offset));
				}
			}
		});

		udpPort.on('error', error => {
			log.error('[osc] Error:', error.stack);
		});

		udpPort.on('open', () => {
			log.info('[osc] X32 port open');
		});

		udpPort.on('close', () => {
			log.info('[osc] X32 port closed');
		});

		udpPort.once('open', () => {
			setInterval(() => {
				broadcastPort.send({
					address: '/info'
				});
			}, 5000);

			setInterval(() => {
				if (mutesChangeWaiting) {
					sendToMainWindow('x32-mutes', mutes, mutesKeyOrder);
					mutesChangeWaiting = false;
				}

				if (configsChangeWaiting) {
					sendToMainWindow('x32-configs', configs);
					configsChangeWaiting = false;
				}
			}, 10);

			renewSubscriptions();
			setInterval(renewSubscriptions, 10000);
		});

		// Open the socket.
		udpPort.open();

		ipcMain.on('toggle', (event, {busName, channelIndex}) => {
			if (!udpPortIsConfigured()) {
				return;
			}

			const absChannelIndex = channelIndex;
			let address;
			if (channelIndex < NUM_CHANNELS) {
				address = '/ch';
			} else {
				address = '/auxin';
				channelIndex -= NUM_CHANNELS;
			}

			address += `/${toFixed2(channelIndex)}/mix`;
			switch (true) {
				case busName === 'main':
					address += '/on';
					break;
				case busName === 'stereo':
					address += '/st';
					break;
				case busName === 'mono':
					address += '/mono';
					break;
				case busName.startsWith('mixbus'):
					address += `/${busName.substr(6)}/on`;
					break;
				default:
					// Do nothing;
			}

			const newVal = mutes[busName][absChannelIndex] ? 'OFF' : 'ON';
			log.debug('Toggling %s to %s', address, newVal);

			udpPort.send({
				address,
				args: [
					{type: 's', value: newVal}
				]
			});
		});

		ipcMain.on('init', () => {
			sendToMainWindow('x32-mutes', mutes, mutesKeyOrder);
			sendToMainWindow(`x32-configs`, configs);
			mutesChangeWaiting = false;
			configsChangeWaiting = false;
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

	// TODO: /config/buslink/1‐2

	// Subscribe to the mute status of every channel on main, mono, and every mixbus.
	for (const busName in mutes) {
		if (!{}.hasOwnProperty.call(mutes, busName)) {
			continue;
		}

		let address = '/mix';
		switch (true) {
			case busName === 'main':
				address += '/on';
				break;
			case busName === 'stereo':
				address += '/st';
				break;
			case busName === 'mono':
				address += '/mono';
				break;
			case busName.startsWith('mixbus'):
				address += `/${busName.substr(6)}/on`;
				break;
			default:
				// Do nothing;
		}

		udpPort.send({
			address: '/batchsubscribe',
			args: [
				{type: 's', value: `/mixMutes/${busName}`},
				{type: 's', value: address},
				{type: 'i', value: 0},
				{type: 'i', value: NUM_CHANNELS_AND_AUX_INS - 1},
				{type: 'i', value: 4}
			]
		});
	}

	// Subscribe to the mute status of every channel on the main mix.
	udpPort.send({
		address: '/batchsubscribe',
		args: [
			{type: 's', value: `/mixMutes/main`},
			{type: 's', value: `/mix/on`},
			{type: 'i', value: 0},
			{type: 'i', value: NUM_CHANNELS_AND_AUX_INS - 1},
			{type: 'i', value: 4}
		]
	});

	// Subscribe to the name and color of every channel.
	udpPort.send({
		address: '/formatsubscribe',
		args: [
			{type: 's', value: '/channelConfigs'},
			{type: 's', value: '/ch/**/config/name'},
			{type: 's', value: '/ch/**/config/color'},
			{type: 'i', value: 1},
			{type: 'i', value: NUM_CHANNELS},
			{type: 'i', value: 80}
		]
	});

	// Subscribe to the name and color of every aux in.
	udpPort.send({
		address: '/formatsubscribe',
		args: [
			{type: 's', value: '/auxinConfigs'},
			{type: 's', value: '/auxin/**/config/name'},
			{type: 's', value: '/auxin/**/config/color'},
			{type: 'i', value: 1},
			{type: 'i', value: NUM_AUX_INS},
			{type: 'i', value: 80}
		]
	});

	// Subscribe to the name and color of every mixbus.
	udpPort.send({
		address: '/formatsubscribe',
		args: [
			{type: 's', value: '/mixbusConfigs'},
			{type: 's', value: '/bus/**/config/name'},
			{type: 's', value: '/bus/**/config/color'},
			{type: 'i', value: 1},
			{type: 'i', value: NUM_MIXBUSES},
			{type: 'i', value: 80}
		]
	});
}

/**
 * Updates the `configs` object with new data from the mixer.
 * This mutates the `configs` object, and does not return anything.
 * @param blob {Buffer}
 * @param type {('channel'|'mixbus'|'auxin')}
 */
function parseConfigs(blob, type) {
	let num = 0;
	switch (type) {
		case 'channel':
			num = NUM_CHANNELS;
			break;
		case 'mixbus':
			num = NUM_MIXBUSES;
			break;
		case 'auxin':
			num = NUM_AUX_INS;
			break;
		default:
			// Do nothing and return.
			return;
	}

	for (let i = 0; i < num; i++) {
		const start = BLOB_START_OFFSET + (i * NAME_LEN_BYTES);
		const end = blob.indexOf(0x00, start);
		const label = blob.toString('ascii', start, end);
		const color = blob.readInt32LE(BLOB_START_OFFSET + (num * NAME_LEN_BYTES) + (i * 4));
		if (label) {
			configs[`${type}${toFixed2(i)}`].label = label;
		}

		configs[`${type}${toFixed2(i)}`].color = COLOR_MAP[color];
	}
}

function toFixed2(num) {
	num = parseInt(num, 10);
	num += 1;
	return num < 10 ? `0${num}` : num;
}

function udpPortIsConfigured() {
	return udpPort && udpPort.options.remoteAddress && udpPort.options.remotePort;
}

function sendToMainWindow(...args) {
	if (mainWindow.isDestroyed()) {
		return;
	}

	mainWindow.webContents.send(...args);
}

function makeMutesArrayProxy() {
	return new Proxy(new Array(NUM_CHANNELS_AND_AUX_INS).fill(false), muteArrayProxyHandler);
}

function makeConfigProxy({name = '', label = ''} = {}) {
	return new Proxy({
		name,
		label,
		color: 'OFF'
	}, channelConfigProxyHandler);
}
