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

TBA
