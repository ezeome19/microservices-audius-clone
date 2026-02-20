const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from the root .env
dotenv.config({ path: path.join(__dirname, '../../../.env') });

const { getSequelize } = require('../src/startup/db');
const { User } = require('../src/models');

const userName = process.argv[2] || 'Admin User';
const userEmail = process.argv[3] || 'admin@audius.com';
const userPassword = process.argv[4] || 'Pass123!';

async function createAdmin() {
    try {
        const sequelize = getSequelize();
        await sequelize.authenticate();

        let user = await User.findOne({ where: { email: userEmail } });

        if (user) {
            console.log(`User ${userEmail} already exists. Promoting to admin...`);
            user.isAdmin = true;
            await user.save();
            console.log('Success: User promoted to admin.');
            process.exit(0);
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(userPassword, salt);

        user = await User.create({
            name: userName,
            email: userEmail,
            password: hashedPassword,
            isAdmin: true,
            userType: 'consumer',
            isEmailVerified: true
        });

        console.log(`Success: Admin user created.`);
        console.log(`Name: ${userName}`);
        console.log(`Email: ${userEmail}`);
        console.log(`Password: ${userPassword}`);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

createAdmin();
