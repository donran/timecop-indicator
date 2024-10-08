import St from 'gi://St';
import Clutter from 'gi://Clutter';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';

import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import {TimecopDatabase} from './TimecopDatabase.js'
import * as log from './logger.js';

export class TimecopIndicator extends PanelMenu.Button {
    _init() {
        super._init(0.0, _('My Shiny TimecopIndicator'));
        const extensionPath = import.meta.url.slice(7).split('/').slice(0,-1).join('/')
        const shareDir = extensionPath.split('/').slice(0, 5).join('/');
        log.info('shareDir:', shareDir);
        log.info("Extension path:", extensionPath);

        this.popupTimerList = [];
        this.timerBox = new St.BoxLayout();
        this.add_child(this.timerBox);


        this.timerIcon = new St.Icon({
            icon_name: 'face-smile-symbolic',
            style_class: 'system-status-icon',
        });

        this.timerText = new St.Label({
            y_align: Clutter.ActorAlign.CENTER,
            text: "Idling"
        });

        this.timerTime = new St.Label({
                y_align: Clutter.ActorAlign.CENTER,
                text: ""
        });

        const svgPath = GLib.build_filenamev([extensionPath, "Timecop.svg"]);
        const iconFile = Gio.File.new_for_path(svgPath);
        const icon = Gio.FileIcon.new(iconFile);
        this.timerIcon.set_gicon(icon);

        this.timerBox.add_child(this.timerIcon);
        this.timerBox.add_child(this.timerText);
        this.timerBox.add_child(this.timerTime);


        let item = new PopupMenu.PopupMenuItem(_('Show Notification'));
        item.connect('activate', () => {
            Main.notify("test", 'Whatʼs up, folks?');
        });
        this.menu.addMenuItem(item);



        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        let testInput = new St.Entry();
        this.menu.box.add_child(testInput);

        const newEntryButton = new PopupMenu.PopupMenuItem(_("Add New Timer"));
        newEntryButton.connect("activate", () => Main.notify("Lmao", "we should add a new entry"));
        this.menu.box.add_child(newEntryButton);


        this._defaultNameColor = "#ffffff";
        this._defaultInactiveNameColor = "#ff755d";
        this._defaultTimerColor = "#5dff8e";
        this._defaultNotTimerColor = "#ff755d";


        this.db = new TimecopDatabase(this, shareDir, 'timecop.db');
        this.refreshInterval = 1000;
        setInterval(() => this.updateTimer(), this.refreshInterval);
    }

    updateTimer() {
        let active = this.db.getActive();
        if (active != null) {
            let nameColor = this._defaultNameColor;
            let timerName = active.description;
            if (active.project != null) {
                nameColor = '#' + active.project.colorHex;
                timerName = `[${active.project.name}] ${active.description}`;
            }
            this.timerText.text = timerName
            this.timerText.set_style(`margin-right: 10px; color: ${nameColor};`);
            const diff = ((new Date()).getTime() - active.updateTime);
            this.timerTime.text = this.millisecondsToString(active.elapsedTime + diff);
            this.timerTime.set_style(`margin-right: 10px; color: ${this._defaultTimerColor};`);
        } else {
            this.timerText.text = 'Idling';
            this.timerText.set_style(`color: ${this._defaultInactiveNameColor};`);
            this.timerTime.text = '';
            this.timerTime.set_style(``);
            return;
        }
    }

    millisecondsToString(ms) {
        ms = Math.floor(ms/1000);
        let out = [];
        if (ms > 60*60) {
            const hours = Math.floor(ms/(60*60));
            out.push(hours);
            ms -= hours*60*60;
        }
        if (ms > 60) {
            const minutes = Math.floor(ms/(60));
            out.push(minutes);
            ms -= minutes*60;
        }
        out.push(ms);
        return out.map(e => e.toString().padStart(2,'0')).join(':');
    }
}
