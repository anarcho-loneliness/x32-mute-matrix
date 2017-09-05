'use strict';

const BLOB_START_OFFSET = 4;
const NAME_LEN_BYTES = 32;
const NUM_CHANNELS = 32;
const NUM_AUX_INS = 8;
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

// Packages
const getPort = require('get-port');
const osc = require('osc');
const {ipcMain} = require('electron');
const log = require('electron-log');

const lastConfigs = {};
let udpPort;
let broadcastPort;
let mainWindow;
let changeWaiting = false;

const muteArrayProxyHandler = {
	set(target, prop, newVal) {
		if (target[prop] === newVal) {
			return true;
		}

		target[prop] = newVal;
		changeWaiting = true;
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

function makeMutesArrayProxy() {
	return new Proxy(new Array(NUM_CHANNELS_AND_AUX_INS).fill(false), muteArrayProxyHandler);
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
				parseChannelConfigs(new Buffer(oscBundle.args[0].value), 'channel');
			} else if (oscBundle.address === '/busConfigs') {
				parseChannelConfigs(new Buffer(oscBundle.args[0].value), 'bus');
			} else if (oscBundle.address.startsWith('/mixMutes/')) {
				const busName = oscBundle.address.substr(10);
				const blob = new Buffer(oscBundle.args[0].value);
				for (let channelNumber = 0; channelNumber < NUM_CHANNELS; channelNumber++) {
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
				if (changeWaiting) {
					sendToMainWindow('x32-mutes', mutes, mutesKeyOrder);
					changeWaiting = false;
				}
			}, 10);

			renewSubscriptions();
			setInterval(renewSubscriptions, 10000);
		});

		// Open the socket.
		udpPort.open();

		ipcMain.on('toggle', (event, {busName, channel}) => {
			if (!udpPortIsConfigured()) {
				return;
			}

			let address = `/ch/${toFixed2(channel)}/mix`;
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

			const newVal = mutes[busName][channel] ? 'OFF' : 'ON';
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

			for (const type in lastConfigs) {
				if (!{}.hasOwnProperty.call(lastConfigs, type)) {
					continue;
				}

				sendToMainWindow(`x32-${type}-configs`, lastConfigs[type]);
			}

			changeWaiting = false;
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

	// Subscribe to the name and color of every mixbus.
	udpPort.send({
		address: '/formatsubscribe',
		args: [
			{type: 's', value: '/busConfigs'},
			{type: 's', value: '/bus/**/config/name'},
			{type: 's', value: '/bus/**/config/color'},
			{type: 'i', value: 1},
			{type: 'i', value: NUM_MIXBUSES},
			{type: 'i', value: 80}
		]
	});
}

function parseChannelConfigs(blob, type) {
	const num = type === 'channel' ? NUM_CHANNELS : NUM_MIXBUSES;
	const configs = new Array(num);
	for (let c = 0; c < num; c++) {
		const start = BLOB_START_OFFSET + (c * NAME_LEN_BYTES);
		const end = blob.indexOf(0x00, start);
		const label = blob.toString('ascii', start, end);
		const color = blob.readInt32LE(BLOB_START_OFFSET + (num * NAME_LEN_BYTES) + (c * 4));
		configs[c] = {label, color: COLOR_MAP[color]};
	}

	lastConfigs[type] = configs;
	sendToMainWindow(`x32-${type}-configs`, configs);
}

function toFixed2(num) {
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
