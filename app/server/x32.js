'use strict';

const BLOB_START_OFFSET = 4;
const NAME_LEN_BYTES = 32;
const NUM_CHANNELS = 32;
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

const mixbusMutes = [];
let udpPort;
let broadcastPort;
let mainWindow;

module.exports = {
	async init(mw) {
		mainWindow = mw;

		for (let i = 0; i < NUM_MIXBUSES; i++) {
			mixbusMutes[i] = new Array(NUM_CHANNELS).fill(false);
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

		setInterval(() => {
			sendToMainWindow('x32-mutes', mixbusMutes);
		}, 100);

		udpPort.on('message', oscBundle => {
			if (oscBundle.address === '/channelConfigs') {
				parseChannelConfigs(new Buffer(oscBundle.args[0].value), 'channel');
			} else if (oscBundle.address === '/busConfigs') {
				parseChannelConfigs(new Buffer(oscBundle.args[0].value), 'bus');
			} else if (oscBundle.address.startsWith('/mixMutes/')) {
				const mixbusNumber = parseInt(oscBundle.address.match(/\d+/)[0], 10);
				if (typeof mixbusNumber !== 'number') {
					return;
				}

				const blob = new Buffer(oscBundle.args[0].value);
				for (let c = 0; c < NUM_CHANNELS; c++) {
					const offset = BLOB_START_OFFSET + (c * 4);
					mixbusMutes[mixbusNumber - 1][c] = Boolean(blob.readInt32LE(offset));
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

	// TODO: /config/buslink/1‐2

	// Subscribe to the mute status of every channel on every mixbus.
	for (let m = 0; m < NUM_MIXBUSES; m++) {
		const formattedM = toFixed2(m);
		udpPort.send({
			address: '/batchsubscribe',
			args: [
				{type: 's', value: `/mixMutes/${formattedM}`},
				{type: 's', value: `/mix/${formattedM}/on`},
				{type: 'i', value: 0},
				{type: 'i', value: NUM_CHANNELS - 1},
				{type: 'i', value: 4}
			]
		});
	}

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
		const name = blob.toString('ascii', start, end);
		const color = blob.readInt32LE(BLOB_START_OFFSET + (num * NAME_LEN_BYTES) + (c * 4));
		configs[c] = {name, color: COLOR_MAP[color]};
	}

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
