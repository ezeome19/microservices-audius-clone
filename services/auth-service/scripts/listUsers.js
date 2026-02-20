const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../../../.env') });

const { getSequelize } = require('../src/startup/db');
const { User } = require('../src/models');

async function listUsers() {
    try {
        const sequelize = getSequelize();
        await sequelize.authenticate();

        const users = await User.findAll({ attributes: ['id', 'name', 'email', 'isAdmin', 'userType'] });

        console.log('--- Current Users ---');
        users.forEach(u => {
            console.log(`${u.name} (${u.email}) - Admin: ${u.isAdmin}, Type: ${u.userType}`);
        });
        console.log('---------------------');
        process.exit(0);
    } catch (error) {
        console.error('Error listing users:', error);
        process.exit(1);
    }
}

listUsers();
