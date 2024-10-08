# GNOME Extension for Timecop
The goal of this extension is to provide a indicator in the GNOME bar for [Timecop](https://github.com/hamaluik/timecop)

Currently it doesn't do much more than modify your `timecop.db` to use BIGINT where we need it, and display hours:minutes:seconds on the currently active item in the top bar. The time is for all items with the same description since midnight.

### NOTE
This extension does modify your `timecop.db` file, it will create two backup tables of `projects` and `timers` in the same database.
This is because libgda doesn't support SQLite's `int` and `integer`, so we need to modify the schema to use `BIGINT` instead.


# Install/Uninstall

## Enable
```
ln -s 'timecop-indicator@donran.se/' '~/.local/share/gnome-shell/extensions/timecop-indicator@donran.se/' || true
gnome-extensions enable timecop-indicator@donran.se
```

## Disable
```
rm -rf ~/.local/share/gnome-shell/extensions/timecop-indicator@donran.se
gnome-extensions disable timecop-indicator@donran.se
```

## Reload GNOME
Press `ALT+F2` and type `restart`, which will restart `gnome-shell`



