require('dotenv').config()
const express=require('express')
const mongoose=require('mongoose')
const cors =require("cors")
const cookieParser=require('cookie-parser') 
const SocketServer = require('./socketServer')
const {PeerServer}=require('peer')

const app=express();
app.use(express.json())
app.use(cors())
app.use(cookieParser())




const http = require('http').createServer(app)
const io = require('socket.io')(http)

io.on('connection', socket => {
    SocketServer(socket)
})

app.use('/api',require('./routes/authRouter'))
app.use('/api',require('./routes/userRouter'))
app.use('/api',require('./routes/postRouter'))
app.use('/api',require('./routes/commentRouter'))
app.use('/api', require('./routes/notifyRouter'))
app.use('/api',require('./routes/messageRouter'))
app.use('/api',require('./routes/tweetRouter'))

app.get('/',(req,res)=>{
    res.send('hello');
})

const URL=process.env.MONGODB_URL;
mongoose.connect(URL,{
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(()=>{
    console.log("Connected to db");
})


const PORT = process.env.PORT || 8001;
http.listen(PORT,()=>{
    console.log(`Listening on port ${PORT}`);
})