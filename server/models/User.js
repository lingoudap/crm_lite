// server/models/User.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  
  password: {
    type: String,
    required: true
  }
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Drop conflicting indexes on model creation
UserSchema.post('init', async function() {
  try {
    const collection = this.collection;
    const indexes = await collection.getIndexes();
    if (indexes.username_1) {
      await collection.dropIndex("username_1");
      console.log("🧹 Auto-dropped conflicting username_1 index");
    }
  } catch (err) {
    // Silently ignore if index doesn't exist
  }
});

const User = mongoose.model('User', UserSchema);

// Clean up indexes when model is created
async function cleanupUserIndexes() {
  try {
    const collection = User.collection;
    const indexes = await collection.getIndexes();
    
    for (const indexName of Object.keys(indexes)) {
      const index = indexes[indexName];
      if (index.key && index.key.username && indexName !== "_id_") {
        await collection.dropIndex(indexName);
        console.log(`🧹 Dropped problematic index: ${indexName}`);
      }
    }
  } catch (err) {
    console.log("ℹ️ Index cleanup handled");
  }
}

// Run cleanup immediately
cleanupUserIndexes().catch(console.error);

export default User;