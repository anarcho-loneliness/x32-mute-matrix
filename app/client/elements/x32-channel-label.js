(function () {
	'use strict';

	const colorizeLabel = require('../lib/colorize-label');

	/**
	 * @customElement
	 * @polymer
	 */
	class X32ChannelLabel extends Polymer.Element {
		static get is() {
			return 'x32-channel-label';
		}

		static get properties() {
			return {
				channel: Object,
				index: Number,
				highlightColumn: {
					type: Number,
					observer: '_highlightColumnChanged'
				}
			};
		}

		static get observers() {
			return [
				'updateColor(channel.color)'
			];
		}

		updateColor(newColorCode) {
			colorizeLabel(newColorCode, this.$.label);
		}

		_highlightColumnChanged(newVal) {
			this.style.opacity = (typeof newVal === 'number' && newVal !== this.index) ?
				window.x32AppDarkenedOpacity :
				'';
		}

		_calcDisplayIndex(index) {
			return index + 1;
		}
	}

	customElements.define(X32ChannelLabel.is, X32ChannelLabel);
})();
