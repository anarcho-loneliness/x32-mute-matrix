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
						const arr = [];
						for (let i = 0; i < 16; i++) {
							arr.push({});
						}
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

			ipcRenderer.on('x32-mutes', (event, mutes) => {
				this.buses.forEach((bus, busIndex) => {
					bus.channels.forEach((channel, channelIndex) => {
						this.set(`buses.${busIndex}.channels.${channelIndex}.muted`, !mutes[busIndex][channelIndex]);
					});
				});
			});

			ipcRenderer.on('x32-channel-configs', (event, configs) => {
				this.channels.forEach((channel, index) => {
					this.set(`channels.${index}.name`, configs[index].name);
					this.set(`channels.${index}.color`, configs[index].color);
				});
			});

			ipcRenderer.on('x32-bus-configs', (event, configs) => {
				this.buses.forEach((bus, index) => {
					this.set(`buses.${index}.name`, configs[index].name);
					this.set(`buses.${index}.color`, configs[index].color);
				});
			});
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

	customElements.define(X32App.is, X32App);
})();
