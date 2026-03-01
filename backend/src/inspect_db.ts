
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/blue-carbon-mrv';

async function run() {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to DB');

    const User = mongoose.model('User', new mongoose.Schema({ walletAddress: String, role: String }));
    const Project = mongoose.model('Project', new mongoose.Schema({ projectId: String, assignedFieldOfficer: String }));

    const users = await User.find({});
    console.log('Users in DB:');
    users.forEach(u => console.log(`- ${u.walletAddress}: ${u.role}`));

    const projects = await Project.find({});
    console.log('Projects in DB:');
    projects.forEach(p => console.log(`- ${p.projectId}: assigned to ${p.assignedFieldOfficer}`));

    process.exit(0);
}
run().catch(err => { console.error(err); process.exit(1); });
