import express, { Request, Response } from 'express';
import nodemailer from 'nodemailer';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
const app = express();

app.use(express.json());

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'rohitdutt04@gmail.com',
      pass: 'kjdhgumpxoyeywkp'
    }
  });
  const sendVerificationEmail = async (email: string, token: string) => {
    const mailOptions = {
      from: 'rohitdutt04@gmail.com',
      to: email,
      subject: 'Verify your account',
      html: `<p>Please click the following link to verify your account:</p><p>http://localhost:3000/verify/${token}</p>`
    };
  
    await transporter.sendMail(mailOptions);
  };
    
interface User {
  id: string;
  email: string;
  password: string;
  isVerified: boolean;
  verificationToken: string;
}

const users: User[] = [];

app.post('/signup', async (req, res) => {
  const { email, password } = req.body;

  // Generate a verification token
  const verificationToken = uuidv4();

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Save the user to the in-memory database
  const user: User = {
    id: uuidv4(),
    email,
    password: hashedPassword,
    isVerified: false,
    verificationToken
  };

  users.push(user);

  // Send the verification email
  await sendVerificationEmail(email, verificationToken);

  res.json({users, message: 'User signed up successfully' });
});

app.get('/verify/:token', async (req, res) => {
  const { token } = req.params;

  const user = users.find((u) => u.verificationToken === token);

  if (!user) {
    return res.status(400).json({ message: 'Invalid token' });
  }

  user.isVerified = true;

  res.json({ message: 'User verified successfully' });
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const user = users.find((u) => u.email === email);

  if (!user) {
    return res.status(400).json({ message: 'Invalid email or password' });
  }

  if (!user.isVerified) {
    return res.status(400).json({ message: 'Account not verified' });
  }

  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) {
    return res.status(400).json({ message: 'Invalid email or password' });
  }

  const token = jwt.sign({ id: user.id }, 'your_secret_key');

  res.json({ token });
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
