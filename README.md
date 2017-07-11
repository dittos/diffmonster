# Diff Monster 👹

Diff Monster is a web app for reviewing GitHub pull requests.

## Try now!

* Example pull requests [1](https://diff.sapzil.org/#/facebook/react/pull/9580) [2](https://diff.sapzil.org/#/kubernetes/kubernetes/pull/46669) [3](https://diff.sapzil.org/#/square/okhttp/pull/3207)
* [Browse your pull requests](https://diff.sapzil.org/)

NOTE: We never send or store your GitHub access token to server! [It's stored in `localStorage`.](https://github.com/dittos/diffmonster/blob/716396c/src/lib/GithubAuth.js#L47)

## What it looks like

![Screenshot](http://blog.sapzil.org/public/img/2017-07-diffmonster.png)

## Features

* Basic stuff: view diff, comment on diff, approve, etc.
* See PRs you need to review in one place
* Easily navigate between files at directory tree / find files using fuzzy finder
* Manage review progress per file

## License

[GPLv3](https://opensource.org/licenses/GPL-3.0)

## Contributing

### Install tools

* Node.js (recommend LTS - 6.x at July 2017)
* [Yarn](https://yarnpkg.com/en/docs/install)

### Prepare

1. Clone repo and `cd`: `git clone https://github.com/dittos/diffmonster.git; cd diffmonster`
2. Copy `src/config.js.sample` to `src/config.js`.
3. Install NPM dependencies: `yarn`

By default it will use the official Firebase project and GitHub app owned by @dittos. If you want to use your own please read [Deployment](https://github.com/dittos/diffmonster/wiki/Deployment#prepare) wiki page and edit `src/config.js` accordingly.

### Run the app locally

```bash
yarn start
# Browser will be opened automatically
```
