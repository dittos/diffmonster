module.exports = {
  client: {
    includes: ['./src/**/*.ts*'],
    service: {
      name: 'github',
      localSchemaFile: './src/schema.graphql',
    }
  }
}