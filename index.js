var beefy = require('beefy')
  , http = require('http')

http.createServer(beefy({
    entries: ['game.js']
  , cwd: __dirname
  , live: true
  , quiet: false
})).listen(1337)
