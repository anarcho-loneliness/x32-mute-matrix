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
			'--x32-channel-label-color': hexColor
		});
	}

	_highlightColumnChanged(newVal) {
		if (typeof newVal === 'number' && newVal !== this.index) {
			this.style.opacity = '0.3';
		} else {
			this.style.opacity = '';
		}
	}

	_calcDisplayIndex(index) {
		return index + 1;
	}
}

customElements.define(X32ChannelLabel.is, X32ChannelLabel);
