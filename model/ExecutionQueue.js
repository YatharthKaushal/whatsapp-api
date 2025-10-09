import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

export const EXECUTION_STATUS = Object.freeze({
  PENDING: "pending",
  ONGOING: "ongoing",
  FAILED: "failed",
  CANCELLED: "cancelled",
  COMPLETED: "completed",
});

/**
 * ExecutionQueue status field:
 * Possible states:
 * - pending: Task is waiting to be processed.
 * - ongoing: Task is currently being processed.
 * - failed: Task processing failed.
 * - cancelled: Task was cancelled before completion.
 * - completed: Task was processed successfully.
 *
 * State transitions:
 * - pending -> ongoing
 * - ongoing -> completed | failed | cancelled
 * - failed/cancelled/completed: terminal states
 */

const executionQueueSchema = new Schema(
  {
    message: {
      type: Schema.Types.ObjectId,
      ref: "MessageHistory",
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(EXECUTION_STATUS),
      default: EXECUTION_STATUS.PENDING,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Optional compound or future indexes can be added here
// executionQueueSchema.index({ message: 1, status: 1 });

const ExecutionQueue =
  models.ExecutionQueue || model("ExecutionQueue", executionQueueSchema);

export default ExecutionQueue;
