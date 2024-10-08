# GNOME Extension for Timecop
The goal of this extension is to provide a indicator in the GNOME bar for [Timecop](https://github.com/hamaluik/timecop)


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

