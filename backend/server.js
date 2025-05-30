import express from "express"
import cors from "cors"
import "dotenv/config"
import connectDB from "./config/mongodb.js"
import connectCloudinary from "./config/cloudinary.js"
import userRouter from "./routes/userRoute.js"
import roomRouter from "./routes/roomRoute.js"
import bookingRouter from "./routes/bookingRoute.js"
import uploadRouter from "./routes/uploadRoute.js"
import subscriberRouter from "./routes/subscriberRoutes.js"
import paymentRouter from "./routes/paymentRoute.js"

// App Config
const app = express()
const port = process.env.PORT || 4000
connectDB()
connectCloudinary()

// Middlewares
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'https://wangobel-hotel.vercel.app', 'https://wangobel-hotel-production-dab7.up.railway.app'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'token', 'Cache-Control', 'Pragma'],
    credentials: true
}))

// API endpoints
app.use('/api/user', userRouter)
app.use('/api/rooms', roomRouter)
app.use('/api/bookings', bookingRouter)
app.use('/api/upload', uploadRouter)
app.use('/api/subscribers', subscriberRouter)
app.use('/api/payments', paymentRouter)

app.get('/', (req, res) => {
    res.send('Wangobel Hotel Management API')
})

app.listen(port, () => console.log(`Server is running on PORT: ${port}`))