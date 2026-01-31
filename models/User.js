import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  university: { type: String, required: true },
});

export default mongoose.model("User", userSchema);
