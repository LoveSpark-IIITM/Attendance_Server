// MongoDb.js
import { MongoClient, ObjectId } from "mongodb";

export default class MongoDBConnection {
  constructor(connectionString, dbName) {
    this.connectionString = connectionString;
    this.dbName = dbName;
    this.client = null;
    this.db = null;
  }

  async connect() {
    this.client = new MongoClient(this.connectionString);
    await this.client.connect();
    this.db = this.client.db(this.dbName);
    console.log("MongoDB connected!");
  }

  async close() {
    if (this.client) await this.client.close();
    console.log("MongoDB connection closed.");
  }

  async insertOne(collectionName, document) {
    if (!this.db) throw new Error("DB not connected");
    const result = await this.db.collection(collectionName).insertOne(document);
    return result.insertedId.toString();
  }

  async findOne(collectionName, query = {}) {
    if (!this.db) throw new Error("DB not connected");
    const doc = await this.db.collection(collectionName).findOne(query);
    if (doc && doc._id) doc._id = doc._id.toString();
    return doc;
  }

  async findMany(collectionName, query = {}) {
    if (!this.db) throw new Error("DB not connected");
    const docs = await this.db.collection(collectionName).find(query).toArray();
    docs.forEach((d) => d._id && (d._id = d._id.toString()));
    return docs;
  }

  async updateOne(collectionName, query, update) {
    if (!this.db) throw new Error("DB not connected");
    if (update._id) {
      delete update._id;
    }
    const res = await this.db.collection(collectionName).updateOne(query, { $set: update });
    return res.modifiedCount > 0;
  }

  async deleteOne(collectionName, query) {
    if (!this.db) throw new Error("DB not connected");
    const res = await this.db.collection(collectionName).deleteOne(query);
    return res.deletedCount > 0;
  }
}
