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
			channel: {
				type: Object,
				observer: '_channelChanged'
			},
			index: Number,
			highlightColumn: {
				type: Number,
				observer: '_highlightColumnChanged'
			}
		};
	}

	_channelChanged(newVal) {
		this.updateStyles({
			'--x32-channel-label-color': newVal.color
		});
	}

	_highlightColumnChanged(newVal) {
		if (typeof newVal === 'number' && newVal !== this.index) {
			this.style.opacity = '0.3';
		} else {
			this.style.opacity = '';
		}
	}

	_calcLabel(index) {
		return index + 1;
	}
}

customElements.define(X32ChannelLabel.is, X32ChannelLabel);
