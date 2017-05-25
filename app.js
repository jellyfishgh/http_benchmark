require('colors')
const cluster = require('cluster')
const http = require('http')
const numCPUs = require('os').cpus().length

const url = 'http://localhost:3000/kh'

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`.yellow)
  // Fork workers.
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork()
  }
  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`.red)
  })
} else {
  // Workers can share any TCP connection
  // In this case it is an HTTP server
  http.get(url, res => {
    const { statusCode } = res
    let error
    if (statusCode !== 200) {
      error = new Error(`Request Failed.\nStatus Code: ${statusCode}`)
    }
    if (error) {
      console.error(error.message.red)
      // consume response data to free up memory
      res.resume()
      return
    }
    res.setEncoding('utf8')
    let rawData = ''
    res.on('data', (chunk) => {
      rawData += chunk
    })
    res.on('end', () => {
      try {
        console.log(rawData)
      } catch (e) {
        console.error(e.message)
      }
    })
  }).on('error', e => {
    console.log(`Got error: ${e.message}`.red)
  })
  console.log(`Worker ${process.pid} started`.yellow)
}
