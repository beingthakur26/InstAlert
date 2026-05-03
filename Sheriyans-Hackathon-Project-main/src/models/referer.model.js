import mongoose from "mongoose";

const refererSchema = new mongoose.Schema({
    referer:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true,
    },
    organization:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Organization",
        required:true,
    },
}, { timestamps: true });

refererSchema.index({ referer: 1, organization: 1 }, { unique: true });
const Referer = mongoose.model("Referer", refererSchema);

export default Referer;