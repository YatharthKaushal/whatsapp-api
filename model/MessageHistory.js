import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const MessageSubSchema = new Schema(
  {
    owner: {
      type: String,
      enum: ["sender", "reply"],
      required: true,
      trim: true,
    },
    body: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

const MessageHistorySchema = new Schema(
  {
    sender: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    messages: {
      type: [MessageSubSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

MessageHistorySchema.index({ sender: 1 }); // Example: index on sender for efficient queries
// Removed index on "messages.createdAt" as MongoDB cannot index fields inside arrays of subdocuments directly

const MessageHistory =
  models.MessageHistory || model("MessageHistory", MessageHistorySchema);

export default MessageHistory;
