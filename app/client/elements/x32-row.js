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
				bus: {
					type: Object,
					observer: '_busChanged'
				},
				index: Number,
				highlightRow: Number,
				highlightColumn: Number
			};
		}

		static get observers() {
			return [
				'_highlightsChanged(highlightRow)'
			];
		}

		_busChanged(newVal) {
			this.updateStyles({
				'--x32-row-color': newVal.color
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
				mixbus: this.index,
				channel: e.target.index
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

		_calcLabel(index) {
			return index + 1;
		}
	}

	customElements.define(X32Row.is, X32Row);
})();
