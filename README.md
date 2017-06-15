# AlexisK starter-basic

Prerequisites:
* nodejs (tested on 7.9.0)

---

Getting Started:
* `npm i`
* `npm start`
This should run app on localhost:3000 with dev environment and initiate file watcher. Each time sources will change, the page will refresh automatically.

---

**If autorebuild does not work**, extending OS maximum watches may be required

(`echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p`)

---

## Running with different environment
Development (default):

`npm run serve:dev`

Staging:

`npm run serve:stage`

Production:

`npm run serve:prod`

Environments settings are located at `/environments/` directory. Settings under `build` key are used for webpack building process, for example `compress` flag determines if javascript should be compressed. Settings under `runtime` key are injected in application's js `ENV` global variable.

---

## Building release
Development:

`npm run build:dev`

Staging:

`npm run build:stage`

Production:

`npm run build:prod`

Executing any of the these commands results in `/build/` directory with application release.

