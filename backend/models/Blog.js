const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true },
    content: { type: String, required: true, trim: true },
    author: { type: String, required: true },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: String, default: () => new Date().toLocaleDateString() },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

module.exports = mongoose.model("Blog", blogSchema);