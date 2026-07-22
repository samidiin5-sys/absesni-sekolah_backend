require('dotenv').config();
const app = require('./app');
const db = require('./models');
const PORT = process.env.PORT || 4000;

db.sequelize.authenticate()
  .then(() => {
    console.log('Database berhasil tersambung');
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  })
  .catch(error => {
    console.error('Database gagal tersambung:', error.message);
    process.exit(1);
  });
