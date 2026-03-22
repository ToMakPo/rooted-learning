import dotenv from 'dotenv'
dotenv.config()

/// EXPRESS ///
import express from 'express'
import cors from 'cors'

const app = express()

app.use(cors())
app.use(express.json())

/// ROUTES ///
// import utilsRoutes from './routes/utils'
// import userRoutes from './routes/user'
// import financeRoutes from './routes/finance'
// import imageSetRoutes from './routes/image-set'

app.get('/', (req, res) => {
	res.send('The server is running!')
})

// app.use('/api', utilsRoutes)
// app.use('/api', userRoutes)
// app.use('/api', financeRoutes)
// app.use('/api', imageSetRoutes)
// app.use('/', require('./routes').default)


/// START SERVER ///
const URL = process.env.URL
const PORT = process.env.PORT

app.listen(PORT, () => {
	console.info(`Server is running on ${URL}:${PORT}`)
})