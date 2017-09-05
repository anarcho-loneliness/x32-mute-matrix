(function () {
	'use strict';

	const {ipcRenderer} = require('electron');

	/**
	 * @customElement
	 * @polymer
	 * @appliesMixin Polymer.GestureEventListeners
	 */
	class X32Row extends Polymer.GestureEventListeners(Polymer.Element) {
		static get is() {
			return 'x32-row';
		}

		static get properties() {
			return {
				bus: Object,
				index: Number,
				highlightRow: Number,
				highlightColumn: Number
			};
		}

		static get observers() {
			return [
				'updateColor(bus.color)',
				'_highlightsChanged(highlightRow)'
			];
		}

		updateColor(newColorCode) {
			let hexColor;
			switch (newColorCode) {
				case 'BL':
				case 'BLi':
					hexColor = '#0000FF';
					break;
				case 'CY':
				case 'CYi':
					hexColor = '#00FFFF';
					break;
				case 'GN':
				case 'GNi':
					hexColor = '#00FF00';
					break;
				case 'MG':
				case 'MGi':
					hexColor = '#FF00FF';
					break;
				case 'OFF':
				case 'OFFi':
					hexColor = '#808080';
					break;
				case 'RD':
				case 'RDi':
					hexColor = '#FF0000';
					break;
				case 'WH':
				case 'WHi':
					hexColor = '#FFFFFF';
					break;
				case 'YE':
				case 'YEi':
					hexColor = '#FFFF00';
					break;
				default:
					// Do nothing.
			}

			this.updateStyles({
				'--x32-row-color': hexColor
			});
		}

		_highlightsChanged(highlightRow) {
			if (typeof highlightRow === 'number' && highlightRow !== this.index) {
				this.$.label.style.opacity = '0.3';
			} else {
				this.$.label.style.opacity = '';
			}
		}

		_handleChannelTap(e) {
			ipcRenderer.send('toggle', {
				busName: this.bus.name,
				channelIndex: e.target.index
			});
		}

		_handleChannelMouseEnter(e) {
			this.dispatchEvent(new CustomEvent('column-mouseenter', {
				detail: {
					row: this.index,
					column: e.target.index
				},
				bubbles: true,
				composed: true
			}));
		}

		_handleChannelMouseLeave(e) {
			this.dispatchEvent(new CustomEvent('column-mouseleave', {
				detail: {
					row: this.index,
					column: e.target.index
				},
				bubbles: true,
				composed: true
			}));
		}

		_calcDarken(highlightRow, highlightColumn, row, column) {
			if (highlightRow === null) {
				return false;
			}

			if (highlightRow === 'all') {
				return highlightColumn !== column;
			}

			return highlightRow !== row && highlightColumn !== column;
		}

		_calcDisplayIndex(busName) {
			if (busName.startsWith('mixbus')) {
				return `#${busName.substr(6)}`;
			}
		}
	}

	customElements.define(X32Row.is, X32Row);
})();
