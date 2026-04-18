# `cj-x-7.github.io`

Static GitHub Pages starter for a data analytics and strategy portfolio.

## Included

- `index.html`: homepage
- `projects/box-office-actors.html`: interactive sample case study
- `styles.css`: shared styling
- `data/box-office.js`: demo dataset with the same shape you can replace later
- `scripts/box-office.js`: filter and chart logic

## Publish on GitHub Pages

1. Create a new public repository named `cj-x-7.github.io` on GitHub.
2. Upload these files to that repository.
3. In GitHub, open `Settings -> Pages` and confirm the source is the `main` branch root.
4. Your site should publish at `https://cj-x-7.github.io/`.

## Before publishing publicly

- Replace `hello@replace-me.com` in `index.html`
- Replace the demo dataset in `data/box-office.js`
- Update the project text so it matches your real work and sources

## Demo data format

Each record in `data/box-office.js` should look like:

```js
{
  title: "Film Title",
  actor: "Actor Name",
  year: 2024,
  genre: "Drama",
  studio: "Studio Name",
  budget: 45,
  worldwide: 130,
  domestic: 52
}
```

Budget and gross values are in millions of USD.
