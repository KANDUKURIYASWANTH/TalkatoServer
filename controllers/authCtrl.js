const Users = require('../models/userModel.js')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const authCtrl={
    register:async(req,res)=>{
        try {
            const {fullname,username,email,password,gender}=req.body
            let newUserName = username.toLowerCase().replace(/ /g,"")
            
            const user_name=await Users.findOne({username:newUserName})
            if(user_name) return res.status(400).json({msg:"This username already exists try another one"})
            
            const user_email=await Users.findOne({email})
            if(user_email) return res.status(400).json({msg:"This email already exists"})

            if(password.length <6)
            return res.status(400).json({msg:"Password should have more than 5 characters"})
            
            const passwordHash = await bcrypt.hash(password,12)
            
            const newUser = new Users({
                fullname,username:newUserName,email,password:passwordHash,gender
            })

            const access_token = createAccessToken({id:newUser._id})
            const refresh_token = createRefreshToken({id:newUser._id})

            res.cookie('refresh_token',refresh_token,{
                httpOnly:true,
                path: 'https://talkatoserver.onrender.com/api/refresh_token',
                maxAge: 30*24*60*60*1000,
                secure: true, // Set to true if you want to restrict to HTTPS only
                sameSite: 'none'
            })
            await newUser.save()
            res.json({
                msg:'Register Success!',
                access_token,
                user:{
                    ...newUser._doc,
                    password:''
                }
            })
        } catch (error) {
            return res.status(500).json({msg:error.message})
        }
    },
    login:async(req,res)=>{
        try {
            const {email,password}=req.body
            const user = await Users.findOne({email})
            .populate('followers following','avatar username fullname followers following')
            if(!user) return res.status(400).json({msg:"This email does not exist"})
            
            const isMatch = await bcrypt.compare(password,user.password)
            if(!isMatch) return res.status(400).json({msg:"Incorrect password!"})

            const access_token = createAccessToken({id:user._id})
            const refresh_token = createRefreshToken({id:user._id})

            res.cookie('refresh_token',refresh_token,{
                httpOnly:true,
                path: 'https://talkatoserver.onrender.com/api/refresh_token',
                maxAge: 30*24*60*60*1000,
                secure: true, // Set to true if you want to restrict to HTTPS only
                sameSite: 'none'
            })
            res.json({
                msg:'Login Success!',
                access_token,
                user:{
                    ...user._doc,
                    password:''
                }
            })
        } catch (error) {
            return res.status(500).json({msg:error.message})
        }
    },
    logout:async(req,res)=>{
        try {
            res.clearCookie('refresh_token',{path: 'https://talkatoserver.onrender.com/api/refresh_token'})
            return res.json({msg:'Logged out!'})
        } catch (err) {
            return res.status(500).json({msg:err.message})
        }
    },
    generateAccessToken:async(req,res)=>{
        try {
            console.log(req.cookies);
            const rf_token = req.cookies.refresh_token
            console.log(rf_token);
            if(!rf_token) return res.status(400).json({msg:"Please login now."})
            jwt.verify(rf_token,process.env.REFRESH_TOKEN_SECRET,async(err,result)=>{
                if(err) return res.status(400).json({msg:"Please login now."})

                const user=await Users.findById(result.id).select("-password")
                .populate('followers following','avatar username fullname followers following')

                if(!user) return res.status(400).json({msg:"This user does not exist"})
                const access_token = createAccessToken({id:result.id})
                res.json({
                    access_token,
                    user
                })
            })
            
        } catch (error) {
            return res.status(500).json({msg:error.message})
        }
    },
    resetPassword:async(req,res)=>{
        try {
            const { email, password } = req.body;
            const user = await Users.findOne({ email });
            if (!user) return res.status(400).json({ msg: 'User not found' });
            const hashedPassword = await bcrypt.hash(password, 10);
    
            await Users.findByIdAndUpdate(user._id, { password: hashedPassword });
            const access_token = createAccessToken({ id: user._id });
            const refresh_token = createRefreshToken({id:user._id})
            res.cookie('refresh_token',refresh_token,{
                httpOnly:true,
                path: 'https://talkatoserver.onrender.com/api/refresh_token',
                maxAge: 30*24*60*60*1000,
                secure: true, // Set to true if you want to restrict to HTTPS only
                sameSite: 'none'
            })
        
            res.json({
              msg: 'Password reset successful',
              access_token,
              user: {
                ...user._doc,
                password: '',
              },
              redirect: '/login',
            });
        }catch (error) {
        return res.status(500).json({msg:error.message})
        }
    }
}
const createAccessToken=(payload)=>{
    return jwt.sign(payload,process.env.ACCESS_TOKEN_SECRET,{expiresIn: '1d'})
}

const createRefreshToken=(payload)=>{
    return jwt.sign(payload,process.env.REFRESH_TOKEN_SECRET,{expiresIn: '30d'})
}
module.exports=authCtrl
