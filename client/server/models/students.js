import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  name: String,
  education: String,
  currentSkills: [String],
  interests: [String],
  targetRole: String,
  experienceLevel: String
}, { timestamps: true });

export default mongoose.model("Student", studentSchema);
