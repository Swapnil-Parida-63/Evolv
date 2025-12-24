import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
  title: String,
  completed: { type: Boolean, default: false }
});

const weekSchema = new mongoose.Schema({
  week: Number,
  tasks: [taskSchema]
});

const roadmapSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true
  },
  targetRole: String,
  timeline: [weekSchema],
  generatedBy: {
    type: String,
    default: "ai"
  }
}, { timestamps: true });

export default mongoose.model("Roadmap", roadmapSchema);
