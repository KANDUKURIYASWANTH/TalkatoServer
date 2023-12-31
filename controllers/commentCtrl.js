const Comments = require('../models/commentModel')
const Posts=require('../models/postModel')
const Tweets=require('../models/tweetModel')

const commentCtrl={
    createComment: async(req,res)=>{
        try {
            const {postId,content,tag,reply,postUserId} = req.body
            const post=await Posts.findById(postId)
            if(!post) return res.status(400).json({msg:"This post doesn't exist"})
            if(reply){
                const cm=await Comments.findById(reply)
                if(!cm) return res.status(400).json({msg:"This comment does not exist"})
            }
            const newComment = new Comments({
                user:req.user._id,content,tag,reply,postUserId,postId
            })
            await Posts.findOneAndUpdate({_id:postId},{
                $push:{comments:newComment._id}
            },{new:true})
            await newComment.save()
            res.json({newComment})
        } catch (err) {
            return res.status(500).json({msg:err.message})
        }
    },
    updateComment: async(req,res)=>{
        try {
            const {content} = req.body
            await Comments.findOneAndUpdate({_id:req.params.id,user:req.user._id},{content})
            res.json({msg:"Update success!"})


        } catch (err) {
            return res.status(500).json({msg:err.message})
        }
    },
    likeComment: async (req, res) => {
        try {
            const comment = await Comments.find({_id: req.params.id, likes: req.user._id})
            if(comment.length > 0) return res.status(400).json({msg: "You liked this comment."})

            await Comments.findOneAndUpdate({_id: req.params.id}, {
                $push: {likes: req.user._id}
            }, {new: true})

            res.json({msg: 'Liked Comment!'})

        } catch (err) {
            return res.status(500).json({msg: err.message})
        }
    },
    unLikeComment: async (req, res) => {
        try {

            await Comments.findOneAndUpdate({_id: req.params.id}, {
                $pull: {likes: req.user._id}
            }, {new: true})

            res.json({msg: 'UnLiked Comment!'})

        } catch (err) {
            return res.status(500).json({msg: err.message})
        }
    },
    deleteComment:async (req,res)=>{
        try {
            const comment = await Comments.findOneAndDelete({
                _id: req.params.id,
                $or: [
                    {user: req.user._id},
                    {postUserId: req.user._id}
                ]
            })

            await Posts.findOneAndUpdate({_id: comment.postId}, {
                $pull: {comments: req.params.id}
            })

            res.json({msg: 'Deleted Comment!'})

        } catch (err) {
            return res.status(500).json({msg: err.message})
        }
    },
    createReply: async(req,res)=>{
        try {
            const {tweetId,content,tag,reply,tweetUserId} = req.body
            const tweet=await Tweets.findById(tweetId)
            if(!tweet) return res.status(400).json({msg:"This tweet doesn't exist"})
            if(reply){
                const cm=await Comments.findById(reply)
                if(!cm) return res.status(400).json({msg:"This comment does not exist"})
            }
            const newComment = new Comments({
                user:req.user._id,content,tag,reply,tweetUserId,tweetId
            })
            await Tweets.findOneAndUpdate({_id:tweetId},{
                $push:{comments:newComment._id}
            },{new:true})
            await newComment.save()
            res.json({newComment})
        } catch (err) {
            return res.status(500).json({msg:err.message})
        }
    },
    updateReply: async(req,res)=>{
        try {
            const {content} = req.body
            await Comments.findOneAndUpdate({_id:req.params.id,user:req.user._id},{content})
            res.json({msg:"Update success!"})


        } catch (err) {
            return res.status(500).json({msg:err.message})
        }
    },
    likeReply: async (req, res) => {
        try {
            const comment = await Comments.find({_id: req.params.id, likes: req.user._id})
            if(comment.length > 0) return res.status(400).json({msg: "You liked this comment."})

            await Comments.findOneAndUpdate({_id: req.params.id}, {
                $push: {likes: req.user._id}
            }, {new: true})

            res.json({msg: 'Liked Comment!'})

        } catch (err) {
            return res.status(500).json({msg: err.message})
        }
    },
    unLikeReply: async (req, res) => {
        try {

            await Comments.findOneAndUpdate({_id: req.params.id}, {
                $pull: {likes: req.user._id}
            }, {new: true})

            res.json({msg: 'UnLiked Comment!'})

        } catch (err) {
            return res.status(500).json({msg: err.message})
        }
    },
    deleteReply:async (req,res)=>{
        try {
            const comment = await Comments.findOneAndDelete({
                _id: req.params.id,
                $or: [
                    {user: req.user._id},
                    {postUserId: req.user._id}
                ]
            })

            await Tweets.findOneAndUpdate({_id: comment.tweetId}, {
                $pull: {comments: req.params.id}
            })

            res.json({msg: 'Deleted Comment!'})

        } catch (err) {
            return res.status(500).json({msg: err.message})
        }
    }
}
module.exports = commentCtrl