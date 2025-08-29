const { MongoClient, ObjectId } = require('mongodb');

class MongoDBConnection {
  /**
   * Initialize MongoDB connection.
   * @param {string} connectionString - MongoDB connection URI.
   * @param {string} dbName - Name of the database.
   */
  constructor(connectionString, dbName) {
    this.connectionString = connectionString;
    this.dbName = dbName;
    this.client = null;
    this.db = null;
  }

  /**
   * Establish a connection to MongoDB.
   */
  async connect() {
    try {
      this.client = new MongoClient(this.connectionString);
      await this.client.connect();
      this.db = this.client.db(this.dbName);
      console.log('Successfully connected to MongoDB!');
    } catch (error) {
      console.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  /**
   * Close the MongoDB connection.
   */
  async close() {
    try {
      if (this.client) {
        await this.client.close();
        console.log('MongoDB connection closed.');
      }
    } catch (error) {
      console.error('Error closing MongoDB connection:', error);
      throw error;
    }
  }

  /**
   * Insert a single document into a collection.
   * @param {string} collectionName - Name of the collection.
   * @param {Object} document - Document to insert.
   * @returns {string} The inserted document's ID.
   */
  async insertOne(collectionName, document) {
    if (!this.db) {
      throw new Error('Database not connected.');
    }
    const collection = this.db.collection(collectionName);
    const result = await collection.insertOne(document);
    return result.insertedId.toString();
  }

  /**
   * Find a single document in a collection.
   * @param {string} collectionName - Name of the collection.
   * @param {Object} query - Query to filter documents.
   * @returns {Object|null} The found document or null.
   */
  async findOne(collectionName, query = {}) {
  if (!this.db) {
    throw new Error('Database not connected.');
  }
  const collection = this.db.collection(collectionName);
  const document = await collection.findOne(query);
  if (document && document._id) {
    document._id = document._id.toString();
  }
  return document;
}


  /**
   * Find multiple documents in a collection.
   * @param {string} collectionName - Name of the collection.
   * @param {Object} query - Query to filter documents.
   * @returns {Array} List of found documents.
   */
  async findMany(collectionName, query = {}) {
    if (!this.db) {
      throw new Error('Database not connected.');
    }
    const collection = this.db.collection(collectionName);
    const documents = await collection.find(query).toArray();
    documents.forEach((doc) => {
      if (doc._id) {
        doc._id = doc._id.toString();
      }
    });
    return documents;
  }

  /**
   * Update a single document in a collection.
   * @param {string} collectionName - Name of the collection.
   * @param {Object} query - Query to filter documents.
   * @param {Object} update - Update to apply.
   * @returns {boolean} True if the update was successful, false otherwise.
   */
  async updateOne(collectionName, query, update) {
    if (!this.db) {
      throw new Error('Database not connected.');
    }
    const collection = this.db.collection(collectionName);
    const result = await collection.updateOne(query, { $set: update });
    return result.modifiedCount > 0;
  }

  /**
   * Delete a single document from a collection.
   * @param {string} collectionName - Name of the collection.
   * @param {Object} query - Query to filter documents.
   * @returns {boolean} True if the deletion was successful, false otherwise.
   */
  async deleteOne(collectionName, query) {
    if (!this.db) {
      throw new Error('Database not connected.');
    }
    const collection = this.db.collection(collectionName);
    const result = await collection.deleteOne(query);
    return result.deletedCount > 0;
  }
}

module.exports = MongoDBConnection;
