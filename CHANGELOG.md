# Change Log

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

<a name="1.0.1"></a>
## [1.0.1](https://github.com/lange/x32-mute-matrix/compare/v1.0.0...v1.0.1) (2017-11-09)


### Bug Fixes

* **autoupdater:** fix autoupdater never checking for updates ([a494e45](https://github.com/lange/x32-mute-matrix/commit/a494e45))



<a name="1.0.0"></a>
# [1.0.0](https://github.com/lange/x32-mute-matrix/compare/v0.0.3...v1.0.0) (2017-11-09)


### Bug Fixes

* fix highlight crosshair being lost sometimes when toggling a channel's mute status ([ba5bc92](https://github.com/lange/x32-mute-matrix/commit/ba5bc92))
* ignore traffic from unexpected sources ([bcbdd16](https://github.com/lange/x32-mute-matrix/commit/bcbdd16))
* remove leading zeroes from row bus numbers ([68df684](https://github.com/lange/x32-mute-matrix/commit/68df684))
* use more appropriate cursors on channel buttons and labels ([8b4cb87](https://github.com/lange/x32-mute-matrix/commit/8b4cb87))


### Features

* add connection status indicator; redesign connection dialog ([3dc99a9](https://github.com/lange/x32-mute-matrix/commit/3dc99a9))
* add support for click-and-drag toggling of mutes ([57f514f](https://github.com/lange/x32-mute-matrix/commit/57f514f)), closes [#1](https://github.com/lange/x32-mute-matrix/issues/1)
* make channel labels sit at an angle for improved legibility ([8169bdf](https://github.com/lange/x32-mute-matrix/commit/8169bdf))
* redesign labels, differentiate between inverted and non-inverted colors ([a59d972](https://github.com/lange/x32-mute-matrix/commit/a59d972))


### Performance Improvements

* **client:** greatly improve general UI performance & framerate ([f951033](https://github.com/lange/x32-mute-matrix/commit/f951033))
* **x32-row:** use window.x32AppDarkenedOpacity for setting label opacity ([39d4404](https://github.com/lange/x32-mute-matrix/commit/39d4404))



<a name="0.0.3"></a>
## [0.0.3](https://github.com/lange/x32-mute-matrix/compare/v0.0.2...v0.0.3) (2017-09-07)


### Features

* implement UI for accepting automatic updates ([c22b015](https://github.com/lange/x32-mute-matrix/commit/c22b015))
* slightly reduce crosshair dimming ([c5007d4](https://github.com/lange/x32-mute-matrix/commit/c5007d4))



<a name="0.0.2"></a>
## [0.0.2](https://github.com/lange/x32-mute-matrix/compare/v0.0.1...v0.0.2) (2017-09-05)


### Bug Fixes

* **about:** use correct LICENSE and repo urls ([6a4a845](https://github.com/lange/x32-mute-matrix/commit/6a4a845))
* **build:** change how and when artifacts are published ([4dbe910](https://github.com/lange/x32-mute-matrix/commit/4dbe910))


### Features

* add support for Aux Ins ([4109016](https://github.com/lange/x32-mute-matrix/commit/4109016))
* add support for Main and Mono buses ([afadac2](https://github.com/lange/x32-mute-matrix/commit/afadac2))


### Performance Improvements

* simplify mix mutes fetching code, send less updates to client ([3274eef](https://github.com/lange/x32-mute-matrix/commit/3274eef))
