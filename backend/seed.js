const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

mongoose.connect("mongodb://127.0.0.1:27017/university-lab-procurement");

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: String,
  phone: String,
  address: String,
  department: String,
  authorizedRepresentative: { name: String, email: String, phone: String },
  verified: { type: Boolean, default: false }
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

async function seed() {
  const hashed = await bcrypt.hash("password123", 10);
  const user = await User.findOneAndUpdate(
    { email: "university@demo.com" },
    {
      name: "Demo University",
      email: "university@demo.com",
      password: hashed,
      role: "university",
      phone: "01700000000",
      address: "123 University Road, Dhaka",
      department: "Computer Science",
      authorizedRepresentative: {
        name: "Dr. Ahmed",
        email: "ahmed@demo.com",
        phone: "01711111111"
      },
      verified: true
    },
    { upsert: true, new: true }
  );
  console.log("✅ Dummy university account created:");
  console.log("   Email:    university@demo.com");
  console.log("   Password: password123");
  mongoose.disconnect();
}

seed().catch(console.error);
