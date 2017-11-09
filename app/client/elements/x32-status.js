(function () {
	'use strict';
	const {ipcRenderer} = require('electron');

	/**
	 * @customElement
	 * @polymer
	 */
	class X32Status extends Polymer.Element {
		static get is() {
			return 'x32-status';
		}

		static get properties() {
			return {
				status: {
					type: String,
					reflectToAttribute: true,
					value: 'offline'
				}
			};
		}

		ready() {
			super.ready();
			ipcRenderer.on('x32-connection-status', (event, status) => {
				this.status = status;
			});

			this.addEventListener('click', () => {
				ipcRenderer.send('openConnectionWindow');
			});
		}
	}

	customElements.define(X32Status.is, X32Status);
})();
