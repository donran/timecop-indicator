import Gda from 'gi://Gda?version=6.0';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import * as log from './logger.js';

import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
export class TimecopTimer {
    id = 0;
    project_id = 0;
    description = "";
    start_time = 0;
    end_time = 0;
    notes = "";
}
export class TimecopActive {
    description = "";
    elapsedTime = 0;
    updateTime = 0;
    project = null;
}
export class TimecopResult {
    groups = {};
    totals = {};
    active = null
}

export class TimecopProject {
    id = 0;
    name = "";
    colorHex = "";
    archived = false;
}

const dayInMs = 1000 * 60 * 60 * 24;

export class TimecopDatabase {
    constructor(indicator, dbDir, dbName) {
        // dbDir = '/tmp/test/'; // for test
        this.connection = new Gda.Connection({
            provider: Gda.Config.get_provider('SQLite'),
            cncString: `DB_DIR=${dbDir};DB_NAME=${dbName}`,
        })
        this.reconfigureDatabase();
        this.indicator = indicator;
        this.dbFile = Gio.File.new_for_path(GLib.build_filenamev([dbDir, dbName]));
        this.dbMonitor = this.dbFile.monitor(Gio.FileMonitorFlags.WATCH_MOVES, null);


        this.dbMonitor.timecopDatabaseContext = this; // this is stupid
        this.dbMonitor.connect('changed', (_fileMonitor, file, otherFile, eventType) => {
            if (eventType == Gio.FileMonitorEvent.CHANGED) {
                 _fileMonitor.timecopDatabaseContext.processUpdates();
            }
        })
        this.timers = [];
        this.projects = {};
        // Initial setup
        this.processUpdates();
    }
    processUpdates() {
        // Update projects
        this.getProjects();


        let newTimers = [];
        let groups = {};
        let timeNow = (new Date()).getTime();
        let dayStart = timeNow - (timeNow % dayInMs);
        const relevantTimers = this.getTimers().filter(e => e.end_time == null || e.end_time > dayStart);


        relevantTimers.forEach(timer => {
            if (groups[timer.description] == undefined) groups[timer.description] = [];
            groups[timer.description].push(timer);
        });
        let result = new TimecopResult();
        result.groups = groups;
        //Object.keys(groups).forEach(e => { result.totals[e] = 0 });
        for (const [groupName, timers] of Object.entries(groups)) {
            let groupSum = 0;
            const timePerTimer = timers.map(timer => (timer.end_time??timeNow) - timer.start_time);
            timePerTimer.forEach(e => { groupSum += e});
            result.totals[groupName] = groupSum;
        }
        this.timers = newTimers;

        const activeTimers = relevantTimers.filter(e => e.end_time == null);
        if (activeTimers.length > 0) {
            let firstTimer = activeTimers[0];
            result.active = new TimecopActive();
            result.active.description = firstTimer.description;
            result.active.elapsedTime = result.totals[activeTimers[0].description]
            result.active.updateTime = timeNow;
            if (firstTimer.project_id != null && this.projects[firstTimer.project_id] != undefined) {
                result.active.project = this.projects[firstTimer.project_id];
            }
        }
        this.currentResult = result;
    }

    getActive() {
        return this.currentResult.active;
    }

    getProjects() {

        try {
            this.connection.open();
            const dm = this.connection.execute_select_command('SELECT * FROM projects;');

            const iter = dm.create_iter();
            while (iter.move_next()) {
                let newProject = new TimecopProject();
                newProject.id = iter.get_value_for_field('id');
                newProject.name = iter.get_value_for_field('name');
                newProject.colorHex = iter.get_value_for_field('colour').toString(16).slice(2);
                newProject.archived = iter.get_value_for_field('archived');
                this.projects[newProject.id] = newProject;
            }
        } catch(err) {
            console.warn('getProjects failed:', err);
            return [];

        }finally {
            this.connection.close()
        }
    }

    getTimers() {
        let out = [];
        try {
            this.connection.open();
            const dm = this.connection.execute_select_command('SELECT * FROM timers;');

            const iter = dm.create_iter();
            while (iter.move_next()) {
                let newTimer = new TimecopTimer();
                newTimer.id = iter.get_value_for_field('id');
                const projectId = iter.get_value_for_field('project_id');
                newTimer.project_id = projectId != null ? parseInt(projectId) : null;
                newTimer.description = iter.get_value_for_field('description');
                const start_time = iter.get_value_for_field('start_time');
                newTimer.start_time = start_time != null ? parseInt(start_time) : null;
                const end_time = iter.get_value_for_field('end_time');
                newTimer.end_time = end_time != null ? parseInt(end_time) : null;
                newTimer.notes = iter.get_value_for_field('notes');
                out.push(newTimer);
            }
        } catch(err) {
            console.warn('failed:', err);
            return [];

        }finally {
            this.connection.close()
        }
        return out
    }

    reconfigureDatabase() {
        // Now this is stupid because libgda should support 64bit integers,
        // but for some reason it will say the times are too large and fail.
        // so we just do the stupid solution of just changing int to BIGINT for
        // those columns.......
        try {
            this.connection.open();

            // Check if we can use describe_column(col) on the table instead?
            // https://gjs-docs.gnome.org/gda50~5.0/gda.datamodel#method-describe_column
            let dm = this.connection.execute_select_command(`
            SELECT * FROM sqlite_schema
                WHERE (name = 'timers' AND sql LIKE '%start_time int%')
                OR    (name = 'projects' AND sql LIKE '%colour int%');
            `)
            if (dm.get_n_rows() == 0) {// already reconfigured
                log.info("Already reconfigured database");
                return
            }
            log.info("reconfiguring database");
            for (const sql of reconfigureSql) {
                dm = this.connection.execute_non_select_command(sql);
            }
        } catch (err) {
            log.info("Reconfigure failed:", err);
            return;
        } finally {
            this.connection.close();
        }

    }

}

const reconfigureSql = [
    `DROP TABLE IF EXISTS bkp_timers;`,
    `DROP TABLE IF EXISTS bkp_projects;`,
    `CREATE TABLE bkp_timers(
        id integer not null primary key autoincrement,
        project_id integer default null,
        description text not null,
        start_time int not null,
        end_time int default null,
        notes text default null,
        foreign key(project_id) references projects(id) on delete set null
    );`,
    `CREATE TABLE bkp_projects(
        id integer not null primary key autoincrement,
        name text not null,
        colour int not null,
        archived boolean not null default 0
    );`,
    `INSERT INTO bkp_timers SELECT * FROM timers;`,
    `INSERT INTO bkp_projects SELECT * FROM projects;`,
    `DROP TABLE IF EXISTS timers;`,
    `DROP TABLE IF EXISTS projects;`,
    `CREATE TABLE timers(
        id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        project_id integer DEFAULT NULL,
        description TEXT NOT NULL,
        start_time BIGINT DEFAULT 0,
        end_time BIGINT DEFAULT 0,
        notes TEXT DEFAULT NULL,
        foreign key(project_id) references projects(id) on delete set null
    );`,
    `CREATE TABLE projects(
        id integer not null primary key autoincrement,
        name text not null,
        colour BIGINT not null,
        archived boolean not null default 0
    );`,
    `INSERT INTO timers SELECT * FROM bkp_timers;`,
    `INSERT INTO projects SELECT * FROM bkp_projects;`
];
