import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
  try {
    const token = req.header("Authorization");

    if (!token) {
      return res.status(401).json({ error: "Access Denied. No token." });
    }

    const verified = jwt.verify(
      token.replace("Bearer ", ""),
      process.env.JWT_SECRET
    );

    req.user = verified;
    next();

  } catch (err) {
    res.status(401).json({ error: "Invalid Token" });
  }
};

export default authMiddleware;
