export default ({
  input: './index.js', // resolved by our plugin
  external: ['moment','ali-rds','co','fs','path',"node-fetch"],
  output: [{
    file: './dist/serverLessTools.js',
    format:'cjs'
  }]
});