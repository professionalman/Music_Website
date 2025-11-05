require('dotenv').config();
const mongoose = require('mongoose');

async function createAdmin() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const User = require('./backend/models/User');

        // Check if admin already exists
        const existingAdmin = await User.findOne({ role: 'admin' });
        if (existingAdmin) {
            console.log('Admin already exists!');
            console.log('Email:', existingAdmin.email);
            console.log('Username:', existingAdmin.username);
            return;
        }

        // Create new admin user
        // const admin = await User.create({
        //     username: 'admin',
        //     email: 'admin@mymusic.com',
        //     password: 'admin123',
        //     role: 'admin'
        // });

        console.log('Admin user created successfully!');
        console.log('Email: admin@mymusic.com');
        console.log('Password: admin123');
        console.log('Username: admin');

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await mongoose.connection.close();
    }
}

createAdmin();