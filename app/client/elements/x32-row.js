(function () {
	'use strict';

	const {ipcRenderer} = require('electron');
	const colorizeLabel = require('../lib/colorize-label');

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
			colorizeLabel(newColorCode, this.$.label);
		}

		_highlightsChanged(highlightRow) {
			this.$.label.style.opacity = (typeof highlightRow === 'number' && highlightRow !== this.index) ?
				window.x32AppDarkenedOpacity :
				1;
		}

		_handleChannelToggle(e) {
			ipcRenderer.send('toggle', {
				busName: this.bus.name,
				channelIndex: e.target.index
			});
		}

		_handleChannelMouseEnter(e) {
			const customEvent = new CustomEvent('column-mouseenter', {
				detail: {
					row: this.index,
					column: e.target.index
				},
				bubbles: true,
				composed: true
			});
			customEvent.x = e.x;
			customEvent.y = e.y;
			this.dispatchEvent(customEvent);
		}

		_handleChannelMouseLeave(e) {
			const customEvent = new CustomEvent('column-mouseleave', {
				detail: {
					row: this.index,
					column: e.target.index
				},
				bubbles: true,
				composed: true
			});
			customEvent.x = e.x;
			customEvent.y = e.y;
			this.dispatchEvent(customEvent);
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
				return `#${parseInt(busName.substr(6), 10)}`;
			}
		}
	}

	customElements.define(X32Row.is, X32Row);
})();
