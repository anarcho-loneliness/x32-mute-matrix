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
						return [{
							name: 'Couch L',
							color: '#2AD1D7'
						}, {
							name: 'Couch R',
							color: '#2AD1D7'
						}, {
							name: 'Host Talkback',
							color: '#DD24A0'
						}, {
							name: 'Guest Discord',
							color: '#31D72A'
						}, {
							name: 'ProdComms L',
							color: '#D72A2A'
						}, {
							name: 'ProdComms R',
							color: '#D72A2A'
						}, {
							name: 'Bus 7',
							color: '#808080'
						}, {
							name: 'Bus 8',
							color: '#808080'
						}, {
							name: 'Player 1 L',
							color: '#31D72A'
						}, {
							name: 'Player 2 R',
							color: '#31D72A'
						}, {
							name: 'Player 2 L',
							color: '#31D72A'
						}, {
							name: 'Player 2 R',
							color: '#31D72A'
						}, {
							name: 'Player 3 L',
							color: '#31D72A'
						}, {
							name: 'Player 3 R',
							color: '#31D72A'
						}, {
							name: 'Player 4 L',
							color: '#31D72A'
						}, {
							name: 'Player 4 R',
							color: '#31D72A'
						}];
					}
				},
				channels: {
					type: Array,
					value() {
						return [{
							name: 'Couch 1',
							color: '#2AD1D7'
						}, {
							name: 'Couch 2',
							color: '#2AD1D7'
						}, {
							name: 'Couch 3',
							color: '#2AD1D7'
						}, {
							name: 'Host',
							color: '#DD24A0'
						}, {
							name: 'Player 1',
							color: '#31D72A'
						}, {
							name: 'Player 2',
							color: '#31D72A'
						}, {
							name: 'Player 3',
							color: '#31D72A'
						}, {
							name: 'Player 4',
							color: '#31D72A'
						}, {
							name: 'ObserverPC L',
							color: '#FCF300'
						}, {
							name: 'ObserverPC R',
							color: '#FCF300'
						}, {
							name: 'Music L',
							color: '#ffffff'
						}, {
							name: 'Music R',
							color: '#ffffff'
						}, {
							name: 'Production L',
							color: '#ffffff'
						}, {
							name: 'Production R',
							color: '#ffffff'
						}, {
							name: 'GuestDiscord',
							color: '#31D72A'
						}, {
							name: 'Ch 16',
							color: '#808080'
						}, {
							name: 'PC 1 L',
							color: '#FCF300'
						}, {
							name: 'PC 1 R',
							color: '#FCF300'
						}, {
							name: 'PC 2 L',
							color: '#FCF300'
						}, {
							name: 'PC 2 R',
							color: '#FCF300'
						}, {
							name: 'PC 3 L',
							color: '#FCF300'
						}, {
							name: 'PC 3 R',
							color: '#FCF300'
						}, {
							name: 'PC 4 L',
							color: '#FCF300'
						}, {
							name: 'PC 4 R',
							color: '#FCF300'
						}, {
							name: 'Lav',
							color: '#31D72A'
						}, {
							name: 'Donations',
							color: '#31D72A'
						}, {
							name: 'Shadow',
							color: '#D72A2A'
						}, {
							name: 'Tech',
							color: '#D72A2A'
						}, {
							name: 'Observer',
							color: '#D72A2A'
						}, {
							name: 'Floor Manager',
							color: '#D72A2A'
						}, {
							name: 'Console L',
							color: '#ffffff'
						}, {
							name: 'Console R',
							color: '#ffffff'
						}];
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

			ipcRenderer.on('x32-data', (event, data) => {
				this.buses.forEach((bus, busIndex) => {
					bus.channels.forEach((channel, channelIndex) => {
						this.set(`buses.${busIndex}.channels.${channelIndex}.muted`, !data[busIndex][channelIndex]);
					});
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

	customElements.define(X32App.is, X32App);

	function clone(obj) {
		return JSON.parse(JSON.stringify(obj));
	}
})();
