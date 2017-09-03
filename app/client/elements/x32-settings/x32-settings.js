(function () {
	'use strict';

	const ipcRenderer = require('electron').ipcRenderer;

	/**
	 * @customElement
	 * @polymer
	 */
	class X32Settings extends Polymer.Element {
		static get is() {
			return 'x32-settings';
		}

		static get properties() {
			return {};
		}

		ready() {
			super.ready();
			this.clearError = this.clearError.bind(this);
			this.$.ipInput.addEventListener('change', this.clearError);
			this.$.portInput.addEventListener('change', this.clearError);
		}

		submit() {
			const ip = this.$.ipInput.value;
			const port = parseInt(this.$.portInput.value, 10);
			ipcRenderer.sendSync('submitIpPort', ip, port);
		}

		clearError() {

		}

		_handleInputKeyDown(e) {
			// Enter key
			if (e.which === 13) {
				this.submit();
			} else {
				this.clearError();
			}
		}
	}

	customElements.define(X32Settings.is, X32Settings);
})();
