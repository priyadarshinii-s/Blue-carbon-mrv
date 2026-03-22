const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/blue-carbon-mrv')
  .then(async () => {
    const db = mongoose.connection.db;
    const projects = await db.collection('projects').find({ 
        projectId: { $in: ["NCCR-2026-2518", "NCCR-2026-5200"] } 
    }).toArray();
    
    for (const p of projects) {
        console.log(`\n--- Project: ${p.projectId} ---`);
        console.log('baselinePhotos:', p.baselinePhotos);
        console.log('baselineVideos:', p.baselineVideos);
    }
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
