let app;
try {
  app = require('../app');
} catch (error) {
  app = (req, res) => {
    res.status(500).send("MODULE LOAD CRASHED: " + error.message + "\n" + error.stack);
  };
}

module.exports = app;
