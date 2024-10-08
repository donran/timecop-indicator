import GObject from 'gi://GObject';
import Gom from 'gi://Gom';
import GLib from 'gi://GLib';

import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import {TimecopIndicator as TimecopIndicatorClass} from './indicator.js'
const TimecopIndicator = GObject.registerClass(TimecopIndicatorClass);

export default class IndicatorExampleExtension extends Extension {
    enable() {
        this._indicator = new TimecopIndicator();
        Main.panel.addToStatusArea(this.uuid, this._indicator);
    }

    disable() {
        this._indicator.destroy();
        this._indicator = null;
    }
}

