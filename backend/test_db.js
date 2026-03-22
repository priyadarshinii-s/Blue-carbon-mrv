const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/blue-carbon-mrv')
  .then(async () => {
    const db = mongoose.connection.db;
    const projects = await db.collection('projects').find({}).sort({createdAt: -1}).limit(3).toArray();
    
    for (const p of projects) {
        console.log(`\n--- Project: ${p.projectName} ---`);
        console.log('baselinePhotos:', p.baselinePhotos);
    }
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
