(function () {
	'use strict';

	const {ipcRenderer} = require('electron');
	Polymer.setPassiveTouchGestures(true); // Added in Polymer v2.1.0

	/**
	 * @customElement
	 * @polymer
	 */
	class X32App extends Polymer.Element {
		static get is() {
			return 'x32-app';
		}

		static get properties() {
			return {
				buses: {
					type: Array,
					value() {
						const arr = [{
							name: 'main',
							label: 'Main'
						}];

						for (let i = 0; i < 16; i++) {
							arr.push({
								name: `mixbus${toFixed2(i)}`
							});
						}

						arr.push({
							name: 'mono',
							label: 'Mono'
						});

						return arr;
					}
				},
				channels: {
					type: Array,
					value() {
						const arr = [];
						for (let i = 0; i < 40; i++) {
							arr.push({});
						}
						return arr;
					}
				},
				highlightRow: {
					type: Number,
					reflectToAttribute: true,
					value: null
				},
				highlightColumn: {
					type: Number,
					reflectToAttribute: true,
					value: null
				}
			};
		}

		ready() {
			this._updateHighlights = this._updateHighlights.bind(this);
			super.ready();

			this.buses.forEach((bus, index) => {
				this.set(`buses.${index}.channels`, clone(this.channels));
			});

			ipcRenderer.on('x32-mutes', (event, mutes, mutesKeyOrder) => {
				this.buses.forEach((bus, busIndex) => {
					bus.channels.forEach((channel, channelIndex) => {
						const values = mutes[mutesKeyOrder[busIndex]];
						this.set(`buses.${busIndex}.channels.${channelIndex}.muted`, !values[channelIndex]);
					});
				});
			});

			ipcRenderer.on('x32-configs', (event, configs) => {
				for (const key in configs) {
					if (!{}.hasOwnProperty.call(configs, key)) {
						continue;
					}

					const index = parseInt(key.match(/\d+$/)[0], 10);
					let path = '';
					switch (true) {
						case key.startsWith('channel'):
							path = `channels.${index - 1}`;
							break;
						case key.startsWith('auxin'):
							path = `channels.${index + 31}`;
							break;
						case key.startsWith('mixbus'):
							path = `buses.${index}`;
							break;
						default:
							// Do nothing.
					}

					this.set(`${path}.label`, configs[key].label);
					this.set(`${path}.color`, configs[key].color);
				}
			});

			ipcRenderer.on('x32-bus-configs', (event, configs) => {
				this.buses.forEach((bus, index) => {
					if (!bus.name.startsWith('mixbus')) {
						return;
					}

					this.set(`buses.${index}.label`, configs[index - 1].label);
					this.set(`buses.${index}.color`, configs[index - 1].color);
				});
			});

			ipcRenderer.on('updateDownloaded', (event, info) => {
				this.$['updateDialog-label'].innerText = `A new version (${info.version}) is ready to install. Would you like to install it now?`;
				this.$.updateDialog.open();
			});

			ipcRenderer.send('init');
		}

		connectedCallback() {
			super.connectedCallback();
			Polymer.RenderStatus.beforeNextRender(this, () => {
				// This is a performance optimization, which prevents
				// needing to continually re-evaluate the CSS Custom Property.
				window.x32AppDarkenedOpacity = parseFloat(this.readCSSCustomProperty('--x32-app-dim-opacity'));
			});
		}

		readCSSCustomProperty(prop) {
			if ('ShadyCSS' in window) {
				return window.ShadyCSS.getComputedStyleValue(this, prop);
			}

			return getComputedStyle(this, prop);
		}

		_debounceUpdateHighlights() {
			this._debouncedDangThing = Polymer.Debouncer.debounce(
				this._debouncedDangThing,
				Polymer.Async.timeOut.after(0),
				this._updateHighlights
			);
		}

		_updateHighlights() {
			// Sometimes, toggling a channel's mute status seems to cause the
			// `_handleRowMouseLeave` and `_handleColumnMouseLeave` events to fire,
			// even if the mouse hasn't moved at all. I couldn't figure out why this was happening,
			// but I was able to implement this weird hack which double-checks what element is
			// actually under the cursor. If the pending highlights don't agree with what is actually
			// under the cursor, then we "recover" what the highlight actually should be based on
			// what we found under the cursor.
			// This is pretty ugly, but it works so whatever.
			// - Lange, 2017/11/07
			if (typeof this._lastMouseScreenX === 'number' &&
				typeof this._lastMouseScreenY === 'number' &&
				this._pendingHighlightColumn === null &&
				this._pendingHighlightRow === null) {
				const elem = this.shadowRoot.elementFromPoint(this._lastMouseScreenX, this._lastMouseScreenY);
				if (elem) {
					if (elem.tagName.toLowerCase() === 'x32-row') {
						this._pendingHighlightRow = elem.index;
						const elemInRow = elem.shadowRoot.elementFromPoint(this._lastMouseScreenX, this._lastMouseScreenY);
						if (elemInRow && elemInRow.tagName.toLowerCase() === 'x32-channel') {
							this._pendingHighlightColumn = elemInRow.index;
						}
					} else if (elem.tagName.toLowerCase() === 'x32-channel-label') {
						this._pendingHighlightColumn = elem.index;
					}
				}
			}

			this.highlightColumn = this._pendingHighlightColumn;
			this.highlightRow = this._pendingHighlightRow;
		}

		_handleColumnLabelMouseEnter(e) {
			this._lastMouseScreenX = e.x;
			this._lastMouseScreenY = e.y;
			this._pendingHighlightColumn = e.target.index;
			this._pendingHighlightRow = 'all';
			this._debounceUpdateHighlights();
		}

		_handleColumnLabelMouseLeave(e) {
			this._lastMouseScreenX = e.x;
			this._lastMouseScreenY = e.y;
			this._pendingHighlightColumn = null;
			this._pendingHighlightRow = null;
			this._debounceUpdateHighlights();
		}

		_handleRowMouseEnter(e) {
			this._lastMouseScreenX = e.x;
			this._lastMouseScreenY = e.y;
			this._pendingHighlightRow = e.target.index;
			this._debounceUpdateHighlights();
		}

		_handleRowMouseLeave(e) {
			this._lastMouseScreenX = e.x;
			this._lastMouseScreenY = e.y;
			this._pendingHighlightRow = null;
			this._debounceUpdateHighlights();
		}

		_handleColumnMouseEnter(e) {
			this._lastMouseScreenX = e.x;
			this._lastMouseScreenY = e.y;
			this._pendingHighlightColumn = e.detail.column;
			this._debounceUpdateHighlights();
		}

		_handleColumnMouseLeave(e) {
			this._lastMouseScreenX = e.x;
			this._lastMouseScreenY = e.y;
			this._pendingHighlightColumn = null;
			this._debounceUpdateHighlights();
		}

		_handleUpdateDialogClosed(e) {
			if (e.detail.confirmed) {
				ipcRenderer.send('installUpdateNow');
			}
		}
	}

	function clone(object) {
		return JSON.parse(JSON.stringify(object));
	}

	function toFixed2(num) {
		num += 1;
		return num < 10 ? `0${num}` : num;
	}

	customElements.define(X32App.is, X32App);
})();
