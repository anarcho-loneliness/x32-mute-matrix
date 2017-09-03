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
				reflectToAttribute: true
			}
		};
	}

	_computeMuted(muted) {
		return Boolean(muted);
	}

	_computeName(name) {
		return name;
	}
}

customElements.define(X32Channel.is, X32Channel);
