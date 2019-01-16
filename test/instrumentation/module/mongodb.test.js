const test = require('tape')
const axios = require('axios')

const { log, fixture, util, enableDataSending } = require('../../test-helper')
enableDataSending()

const Agent = require('agent')
const agent = new Agent(fixture.config)

const mongoose = require('mongoose')
const Schema = mongoose.Schema
const bookSchema = new Schema({
  title: String,
  author: String,
  published_date: { type: Date, default: Date.now }
})
const Book = mongoose.model('book', bookSchema)
// express
const express = require('express')
// koa
const Koa = require('koa')
const Router = require('koa-router')
const koaBodyParser = require('koa-bodyparser')

const TEST_ENV = {
  host: 'localhost',
  port: 5005,
}
const getServerUrl = (path) => `http://${TEST_ENV.host}:${TEST_ENV.port}${path}`

// close client connection
const testCompletions = new Map()
setInterval(() => {
  if (Array.from(testCompletions.values()).every(v => v)) {
    agent.dataSender.closeClient()
  }
}, 2000)

const mongoData = {
  title: 'NODE.js by Pinpoint',
  author: 'iforget',
  published_date: new Date()
}

const testName1 = 'express'
test(`${testName1} should Record the connections between express and mongodb.`, function (t) {
  const testName = testName1
  testCompletions.set(testName, false)

  t.plan(3)

  const app = new express()
  const PATH = `/${testName}/api/books`

  app.use(express.json())
  app.get(PATH, async (req, res) => {
    await Book.find((err, books) => {
      if (err) return res.status(500).send({error:'failure'})
      res.json(books)
    })
  })
  app.get(`${PATH}/:author`, async function(req, res){
    await Book.findOne({author: req.params.author}, function(err, book){
      if(err) return res.status(500).json({error: err})
      if(!book) return res.status(404).json({error: 'book not found'})
      res.json(book)
    })
  })
  app.post(PATH, async function(req, res){
    const { title, author, published_date } = req.body
    const book = new Book({
      title,
      author,
      published_date
    })
    book.save(function(err){
      if(err){
        console.error(err)
        res.json({result: 0})
        return
      }
      res.json({result: 1})
    })
  })
  app.put(`${PATH}/:author`, async function(req, res){
    await Book.update({ author: req.params.author }, { $set: req.body }, function(err, output){
      if(err) res.status(500).json({ error: 'database failure' })
      console.log(output)
      if(!output.n) return res.status(404).json({ error: 'book not found' })
      res.json( { message: 'book updated' })
    })
  })

  const server = app.listen(TEST_ENV.port, async function () {
    const db = mongoose.connection
    db.on('error', console.error)
    db.once('open', function () {
      console.log("Connected to mongod server")
    })

    await mongoose.connect('mongodb://***REMOVED***/mongodb_pinpoint')

    console.log('step1. Insert')
    const rstInsert = await axios.post(getServerUrl(PATH), mongoData)
    t.ok(rstInsert.status, 200)

    // console.log('step2. Find')
    const rstFind = await axios.get(getServerUrl(PATH))
    t.ok(rstFind.status, 200)

    // console.log('step3. Update')
    const rstUpdate = await axios.put(getServerUrl(`${PATH}/iforget`), {
      title: 'SpringBoot by WebFlux',
      published_date: new Date()
    })
    t.ok(rstUpdate.status, 200)

    server.close()
    testCompletions.set(testName, true)
  })
})

const testName2 = 'koa'
test.only(`${testName2} should Record the connections between express and mongodb.`, function (t) {
  const testName = testName2
  testCompletions.set(testName, false)

  t.plan(3)
  const app = new Koa()
  const router = new Router()
  const PATH = `/${testName}/api/books`

  app.use(koaBodyParser())
  router.get(PATH, async (ctx, next) => {
    await Book.find((err, books) => {
      if (err) {
        ctx.status = 500
        ctx.body = `failure :: ${err}`
        return
      }
      ctx.body = JSON.stringify(books)
    })
  })
  router.get(`${PATH}/:author`, async (ctx, next) => {
    await Book.findOne({author: ctx.params.author}, function(err, book){
      if (err) {
        ctx.status = 500
        ctx.body = `failure :: ${err}`
        return
      } else if (!book) {
        ctx.status = 404
        ctx.body = `failure :: book not found`
        return
      }
     ctx.body = JSON.stringify(book)
    })
  })

  router.post(PATH, async (ctx, next) => {
    const { title, author, published_date } = ctx.request.body
    const book = new Book({
      title,
      author,
      published_date
    })
    await book.save()
    ctx.body = "ok. Insert"
  })
  router.put(`${PATH}/:author`, async (ctx, next) => {
    await Book.update({ author: ctx.params.author }, { $set: ctx.request.body }, function(err, output){
      console.log(output);
    })
    ctx.body = 'ok'
  })

  app.use(router.routes()).use(router.allowedMethods())

  const server = app.listen(TEST_ENV.port, async () => {
    const db = mongoose.connection
    db.on('error', console.error)
    db.once('open', function () {
      console.log("Connected to mongod server")
    })

    await mongoose.connect('mongodb://***REMOVED***/mongodb_pinpoint')

    console.log('step1. Insert')
    const rstInsert = await axios.post(getServerUrl(PATH), mongoData)
    t.ok(rstInsert.status, 200)

    console.log('step2. Find')
    const rstFind = await axios.get(getServerUrl(PATH))
    t.ok(rstFind.status, 200)

    console.log('step3. Update')
    const rstUpdate = await axios.put(getServerUrl(`${PATH}/iforget`), {
      title: 'SpringBoot by WebFlux',
      published_date: new Date()
    })
    t.ok(rstUpdate.status, 200)

    server.close()
    testCompletions.set(testName, true)
  })
})
