const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from the root .env
dotenv.config({ path: path.join(__dirname, '../../../.env') });

const { getSequelize } = require('../src/startup/db');
const { User } = require('../src/models');

async function createAdmin(email) {
    if (!email) {
        console.error('Usage: node createAdmin.js <email>');
        process.exit(1);
    }

    try {
        const sequelize = getSequelize();
        // Force authentication/connection
        await sequelize.authenticate();

        const user = await User.findOne({ where: { email } });

        if (!user) {
            console.error(`User with email ${email} not found.`);
            process.exit(1);
        }

        user.isAdmin = true;
        await user.save();

        console.log(`Success! User ${email} is now an Admin.`);
        process.exit(0);
    } catch (error) {
        console.error('Error promoting user:', error);
        process.exit(1);
    }
}

const email = process.argv[2];
createAdmin(email);
