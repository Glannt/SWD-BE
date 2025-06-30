// Script để fix index trong MongoDB cho chatSessions collection
// Chạy script này để xóa index cũ và tạo index mới

const { MongoClient } = require('mongodb');

async function fixSessionIndex() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/swd_db';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db();
    const collection = db.collection('chatSessions');

    // 1. Xóa index cũ trên sessionID nếu tồn tại
    try {
      await collection.dropIndex('sessionID_1');
      console.log('✅ Dropped old index: sessionID_1');
    } catch (error) {
      if (error.code === 26) {
        console.log('ℹ️  Index sessionID_1 does not exist, skipping...');
      } else {
        console.log('⚠️  Error dropping sessionID_1 index:', error.message);
      }
    }

    // 2. Tạo index mới trên chat_session_id
    try {
      await collection.createIndex({ chat_session_id: 1 }, { unique: true });
      console.log('✅ Created new index: chat_session_id_1 (unique)');
    } catch (error) {
      console.log('⚠️  Error creating chat_session_id index:', error.message);
    }

    // 3. Xóa các documents có chat_session_id là null
    const result = await collection.deleteMany({ chat_session_id: null });
    console.log(
      `✅ Deleted ${result.deletedCount} documents with null chat_session_id`,
    );

    // 4. Kiểm tra và tạo chat_session_id cho các documents còn thiếu
    const documentsWithoutId = await collection
      .find({
        chat_session_id: { $exists: false },
      })
      .toArray();

    if (documentsWithoutId.length > 0) {
      console.log(
        `⚠️  Found ${documentsWithoutId.length} documents without chat_session_id`,
      );

      for (const doc of documentsWithoutId) {
        const newId = `chat_session_${doc._id.toString().slice(-12)}`;
        await collection.updateOne(
          { _id: doc._id },
          { $set: { chat_session_id: newId } },
        );
        console.log(
          `✅ Updated document ${doc._id} with chat_session_id: ${newId}`,
        );
      }
    }

    // 5. Liệt kê tất cả indexes hiện tại
    const indexes = await collection.indexes();
    console.log('\n📋 Current indexes:');
    indexes.forEach((index) => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });

    console.log('\n🎉 Database fix completed successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Chạy script
fixSessionIndex().catch(console.error);
