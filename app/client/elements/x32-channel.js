/**
 * @customElement
 * @polymer
 */
class X32Channel extends Polymer.Element {
	static get is() {
		return 'x32-channel';
	}

	static get properties() {
		return {
			importPath: String, // https://github.com/Polymer/polymer-linter/issues/71
			index: Number,
			channel: Object,
			muted: {
				type: Boolean,
				reflectToAttribute: true,
				computed: '_computeMuted(channel.muted)'
			},
			name: {
				type: String,
				reflectToAttribute: true,
				computed: '_computeName(channel.name)'
			},
			darken: {
				type: Boolean,
				observer: '_darkenChanged'
			}
		};
	}

	ready() {
		super.ready();
		this.addEventListener('mousedown', () => {
			X32Channel._mouseDown = true;
			X32Channel._dragToggleState = !this.muted;
		}, {passive: true});
		this.addEventListener('mouseup', () => {
			X32Channel._mouseDown = false;
		}, {passive: true});
		this.addEventListener('mouseenter', () => {
			if (X32Channel._mouseDown && this.muted !== X32Channel._dragToggleState) {
				this.toggle();
			}
		}, {passive: true});
	}

	toggle() {
		this.dispatchEvent(new CustomEvent('toggle', {
			bubbles: false,
			composed: false
		}));
	}

	_computeMuted(muted) {
		return Boolean(muted);
	}

	_computeName(name) {
		return name;
	}

	_darkenChanged(newVal) {
		this.style.opacity = newVal ? window.x32AppDarkenedOpacity : 1;
	}
}

customElements.define(X32Channel.is, X32Channel);
