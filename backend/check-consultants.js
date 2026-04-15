const mongoose = require("mongoose");
const User = require("./models/User");

// Connect to cloud MongoDB (same as backend)
const mongoUri = "mongodb+srv://jihad:unipro123%40@cluster0.k8iixas.mongodb.net/?appName=Cluster0";
mongoose.connect(mongoUri);

async function checkConsultants() {
  try {
    console.log("\n========== CHECKING DATABASE CONSULTANTS ==========\n");

    // Get all consultants
    const allConsultants = await User.find({ role: "consultant" }).select(
      "name email phone role consultantInfo"
    );

    console.log(`Total consultants in database: ${allConsultants.length}\n`);

    allConsultants.forEach((consultant, index) => {
      console.log(`${index + 1}. ${consultant.name}`);
      console.log(`   Email: ${consultant.email}`);
      console.log(`   Expertise: ${consultant.consultantInfo?.expertise?.join(", ") || "None"}`);
      console.log(`   Availability: ${consultant.consultantInfo?.availability}`);
      console.log(`   Rating: ${consultant.consultantInfo?.rating}`);
      console.log("");
    });

    // Get available consultants with Networking expertise
    console.log("Checking Networking expertise filter...\n");
    const networkingConsultants = await User.find({
      role: "consultant",
      "consultantInfo.availability": true,
      "consultantInfo.expertise": "Networking"
    }).select("name email phone consultantInfo");

    console.log(`Found ${networkingConsultants.length} available consultants with Networking expertise:`);
    networkingConsultants.forEach(c => {
      console.log(`  - ${c.name} (${c.consultantInfo?.expertise?.join(", ")})`);
    });

  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    mongoose.disconnect();
  }
}

checkConsultants();
