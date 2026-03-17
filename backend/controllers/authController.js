const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "default_jwt_secret", {
    expiresIn: "30d",
  });
};

exports.registerUser = async (req, res) => {
  try {
    const { 
      name, email, password, role, phone, address, 
      department, authorizedRepresentative,
      tradeLicenseNumber,
      professionalCredentials, relevantExperience, certificationInformation 
    } = req.body;

    // Validate main required fields
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "Please enter name, email, password and select a role" });
    }

    // Role specific validation could be added here manually or left to mongoose schema validation
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
      phone,
      address,
      ...(role === "university" && { department, authorizedRepresentative }),
      ...(role === "vendor" && { tradeLicenseNumber }),
      ...(role === "consultant" && { professionalCredentials, relevantExperience, certificationInformation }),
    });

    await user.save();

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
      message: "User registered successfully"
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
        message: "Login successful"
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
