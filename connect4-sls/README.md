This is an experiment with using the [serverless framework](https://www.serverless.com/) to handle the deployment of the application.

When using this project you'll need node 12. The easiest way of setting that up is with nvm:
```
cd connect4-sls
nvm use
```

To experiment and try this out you'll likely want the `serverless` command installed globally - at least for the version of node on the project:
```
npm i -g serverless
```

You can then install the project dependencies:
```
npm i
```

Finally you can deploy to AWS. This generates cloudformation and applies it to AWS (the target profile/region are specified in the `serverless.ts` configuration file):
```
serverless deploy
```

When modifying just the function code it is quicker to do:
```
npm run deployQuick
```

A dynamo table is also defined in the `serverless.ts` and wired up by name.