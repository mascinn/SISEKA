const { app } = require('../backend/server');
const { initDatabase } = require('../backend/database');
const { autoReconcileUnrecordedDeposits } = require('../backend/utils/reconcile');

let isInitialized = false;

module.exports = async (req, res) => {
  if (!isInitialized) {
    try {
      await initDatabase();
      await autoReconcileUnrecordedDeposits();
      isInitialized = true;
    } catch (err) {
      console.error('Serverless DB initialization error:', err);
    }
  }
  return app(req, res);
};
