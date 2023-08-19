const Tweets=require('../models/tweetModel')
const Users=require('../models/userModel')
const Comments = require('../models/commentModel')

class APIfeatures{
    constructor(query,queryString){
        this.query=query;
        this.queryString=queryString;
    }
    paginating(){
        const page = this.queryString.page * 1 || 1
        const limit = this.queryString.limit * 1|| 9
        const skip = (page-1)*limit
        this.query=this.query.skip(skip).limit(limit)
        return this;
    }
}

const tweetCtrl={
    createTweet:async(req,res)=>{
        try {
            const {content,audios}=req.body
            if(audios.length===0)
            return res.status(400).json({msg:"please add tweets"})

            const newTweet = new Tweets({
                content,audios,user:req.user._id
            })
            await newTweet.save()
            res.json({
                msg:'Create tweet',
                newTweet:{
                    ...newTweet._doc,
                    user:req.user
                }
            })
        } catch (error) {
            return res.status(500).json({msg:error.message})
        }
    },
    getTweets:async(req,res)=>{
        try {
            const features=new APIfeatures(Tweets.find({
                user:[...req.user.following,req.user._id]
            }),req.query).paginating()
            const tweets = await features.query.sort('-createdAt')
            .populate("user likes","avatar username fullname followers")
            .populate({
                path:"comments",
                populate:{
                    path:"user likes",
                    select:'-password'
                }
            })
            res.json({
                msg:"Success!",
                result:tweets.length,
                tweets
            })
        } catch (error) {
            return res.status(500).json({msg:error.message})
        }
    },
    updateTweet:async(req,res)=>{
        try {
            const {content,audios} = req.body
            const tweet = await Tweets.findOneAndUpdate({_id:req.params.id},{
                content,audios
            }).populate("user likes","avatar username fullname")
            .populate({
                path:"comments",
                populate:{
                    path:"user likes",
                    select:'-password'
                }
            })
            res.json({
                msg:"Updated tweet!",
                newTweet:{
                    ...tweet._doc,
                    content,audios
                }
            })
        } catch (error) {
            return res.status(500).json({msg:error.message})
        }
    },
    likeTweet:async (req,res)=>{
        try {
            const tweet=await Tweets.find({_id:req.params.id,likes:req.user._id})
            if(tweet.length>0) return res.status(400).json({msg:"You liked this tweet."})
            const like = await Tweets.findOneAndUpdate({_id:req.params.id},{
                $push:{likes:req.user._id}
            },{new:true})
            if(!like) return res.status(400).json({msg:"This tweet does not exist"})
            res.json({msg:'Liked tweet!'})
        } catch (error) {
            return res.status(500).json({msg:error.message})
        }
    },
    unLikeTweet:async (req,res)=>{
        try {
            const like = await Tweets.findOneAndUpdate({_id:req.params.id},{
                $pull:{likes:req.user._id}
            },{new:true})
            res.json({msg:'Unliked tweet!'})
            if(!like) return res.status(400).json({msg:"This tweet does not exist"})
        } catch (error) {
            return res.status(500).json({msg:error.message})
        }
    },
    getUserTweets:async (req,res)=>{
        try {
            const features=new APIfeatures(Tweets.find({user:req.params.id}),req.query)
            .paginating()
            const tweets = await features.query.sort("-createdAt")
            .populate("user likes","avatar username fullname followers")
            res.json({
                tweets,
                result:tweets.length
            })
        } catch (err) {
            return res.status(500).json({msg:err.message})
            
        }
    },
    getTweet:async(req,res)=>{
        try {
            const tweet = await Tweets.findById(req.params.id)
            .populate("user likes","avatar username fullname followers")
            .populate({
                path:"comments",
                populate:{
                    path:"user likes",
                    select:'-password'
                }
            })
            if(!tweet) return res.status(400).json({msg:"This tweet does not exist"})
            res.json({tweet})
        } catch (err) {
            return res.status(500).json({msg:err.message})
        }
    },
    getTweetsDiscover:async (req,res)=>{
        try {
            const newArr = [...req.user.following, req.user._id]
            const num  = req.query.num || 9

            const tweets = await Tweets.aggregate([
                { $match: { user : { $nin: newArr } } },
                { $sample: { size: Number(num) } },
            ])

            return res.json({
                msg: 'Success!',
                result: tweets.length,
                tweets
            })
        } catch (err) {
            return res.status(500).json({msg:err.message})
        }
    },
    deleteTweet:async (req,res)=>{
        try {
            const tweet=await Tweets.findOneAndDelete({_id:req.params.id,user:req.user._id})
            await Comments.deleteMany({_id:{$in:tweet.comments}})
            res.json({
                msg: 'Deleted tweet!',
                newTweet: {
                    ...tweet,
                    user: req.user
                }
            })
        } catch (err) {
            return res.status(500).json({msg:err.message})
        }
    },
    saveTweet: async (req, res) => {
        try {
            const user = await Users.find({_id: req.user._id, savedTweet: req.params.id})
            if(user.length > 0) return res.status(400).json({msg: "You saved this post."})

            const save = await Users.findOneAndUpdate({_id: req.user._id}, {
                $push: {savedTweet: req.params.id}
            }, {new: true})

            if(!save) return res.status(400).json({msg: 'This user does not exist.'})

            res.json({msg: 'Saved Tweet!'})

        } catch (err) {
            return res.status(500).json({msg: err.message})
        }
    },
    unSaveTweet: async (req, res) => {
        try {
            const save = await Users.findOneAndUpdate({_id: req.user._id}, {
                $pull: {savedTweet: req.params.id}
            }, {new: true})

            if(!save) return res.status(400).json({msg: 'This user does not exist.'})

            res.json({msg: 'unSaved Tweet!'})

        } catch (err) {
            return res.status(500).json({msg: err.message})
        }
    },
}
module.exports=tweetCtrl