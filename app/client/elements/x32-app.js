(function () {
	'use strict';

	const {ipcRenderer} = require('electron');

	/**
	 * @customElement
	 * @polymer
	 */
	class X32App extends Polymer.Element {
		static get is() {
			return 'x32-app';
		}

		static get properties() {
			return {
				buses: {
					type: Array,
					value() {
						const arr = [{
							name: 'main',
							label: 'Main'
						}];

						for (let i = 0; i < 16; i++) {
							arr.push({
								name: `mixbus${toFixed2(i)}`
							});
						}

						arr.push({
							name: 'mono',
							label: 'Mono'
						});

						return arr;
					}
				},
				channels: {
					type: Array,
					value() {
						const arr = [];
						for (let i = 0; i < 32; i++) {
							arr.push({});
						}
						return arr;
					}
				},
				highlightRow: {
					type: Number,
					reflectToAttribute: true,
					value: null
				},
				highlightColumn: {
					type: Number,
					reflectToAttribute: true,
					value: null
				}
			};
		}

		ready() {
			super.ready();

			this.buses.forEach((bus, index) => {
				this.set(`buses.${index}.channels`, clone(this.channels));
			});

			ipcRenderer.on('x32-mutes', (event, mutes, mutesKeyOrder) => {
				this.buses.forEach((bus, busIndex) => {
					bus.channels.forEach((channel, channelIndex) => {
						const values = mutes[mutesKeyOrder[busIndex]];
						this.set(`buses.${busIndex}.channels.${channelIndex}.muted`, !values[channelIndex]);
					});
				});
			});

			ipcRenderer.on('x32-channel-configs', (event, configs) => {
				this.channels.forEach((channel, index) => {
					this.set(`channels.${index}.label`, configs[index].label);
					this.set(`channels.${index}.color`, configs[index].color);
				});
			});

			ipcRenderer.on('x32-bus-configs', (event, configs) => {
				this.buses.forEach((bus, index) => {
					if (!bus.name.startsWith('mixbus')) {
						return;
					}

					this.set(`buses.${index}.label`, configs[index - 1].label);
					this.set(`buses.${index}.color`, configs[index - 1].color);
				});
			});

			ipcRenderer.send('init');
		}

		_handleColumnLabelMouseEnter(e) {
			this.highlightColumn = e.target.index;
			this.highlightRow = 'all';
		}

		_handleColumnLabelMouseLeave() {
			this.highlightColumn = null;
			this.highlightRow = null;
		}

		_handleRowMouseEnter(e) {
			this.highlightRow = e.target.index;
		}

		_handleRowMouseLeave() {
			this.highlightRow = null;
		}

		_handleColumnMouseEnter(e) {
			this.highlightColumn = e.detail.column;
		}

		_handleColumnMouseLeave() {
			this.highlightColumn = null;
		}
	}

	function clone(object) {
		return JSON.parse(JSON.stringify(object));
	}

	function toFixed2(num) {
		num += 1;
		return num < 10 ? `0${num}` : num;
	}

	customElements.define(X32App.is, X32App);
})();
