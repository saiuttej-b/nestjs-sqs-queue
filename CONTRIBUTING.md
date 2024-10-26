# Contributing

1. [Fork it](https://help.github.com/articles/fork-a-repo/)
2. We use PNPM as our package manager. Install it if you haven't already (`npm install -g pnpm`)
3. Install dependencies (`pnpm install`)
4. Create your feature branch (`git checkout -b my-new-feature`)
5. Commit your changes (`git commit -am 'Added some feature'`)
6. Test your changes (`npm test`)
7. Push to the branch (`git push origin my-new-feature`)
8. [Create new Pull Request](https://help.github.com/articles/creating-a-pull-request/)

## Testing

We use [Jest](https://github.com/facebook/jest) to write tests. Run our test suite with this command:

```
pnpm test
```

## Code Style

We use [Prettier](https://prettier.io/) and tslint to maintain code style and best practices.
Please make sure your PR adheres to the guides by running:

```
pnpm run format
```

and

```
pnpm run lint
```
