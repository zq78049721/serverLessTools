export default ({
  input: './index.js', // resolved by our plugin
  external: ['moment','ali-rds','co','fs','path'],
  output: [{
    file: './dist/serverLessTools.js',
    format:'cjs'
  }]
});