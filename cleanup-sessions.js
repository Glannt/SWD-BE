// Script để cleanup chatSessions collection
// Chạy script này để xóa các documents có vấn đề

const { MongoClient } = require('mongodb');

async function cleanupSessions() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/swd_db';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db();
    const collection = db.collection('chatSessions');

    // 1. Xóa tất cả documents có chat_session_id là null
    const nullResult = await collection.deleteMany({ chat_session_id: null });
    console.log(
      `✅ Deleted ${nullResult.deletedCount} documents with null chat_session_id`,
    );

    // 2. Xóa tất cả documents có chat_session_id là undefined
    const undefinedResult = await collection.deleteMany({
      chat_session_id: { $exists: false },
    });
    console.log(
      `✅ Deleted ${undefinedResult.deletedCount} documents with undefined chat_session_id`,
    );

    // 3. Xóa tất cả documents có chat_session_id là empty string
    const emptyResult = await collection.deleteMany({ chat_session_id: '' });
    console.log(
      `✅ Deleted ${emptyResult.deletedCount} documents with empty chat_session_id`,
    );

    // 4. Xóa tất cả documents có sessionID field (field cũ)
    const oldFieldResult = await collection.deleteMany({
      sessionID: { $exists: true },
    });
    console.log(
      `✅ Deleted ${oldFieldResult.deletedCount} documents with old sessionID field`,
    );

    // 5. Kiểm tra và xóa duplicate chat_session_id
    const duplicates = await collection
      .aggregate([
        {
          $group: {
            _id: '$chat_session_id',
            count: { $sum: 1 },
            docs: { $push: '$_id' },
          },
        },
        {
          $match: {
            count: { $gt: 1 },
          },
        },
      ])
      .toArray();

    if (duplicates.length > 0) {
      console.log(
        `⚠️  Found ${duplicates.length} duplicate chat_session_id groups`,
      );

      for (const duplicate of duplicates) {
        // Giữ lại document đầu tiên, xóa các document còn lại
        const docsToDelete = duplicate.docs.slice(1);
        const deleteResult = await collection.deleteMany({
          _id: { $in: docsToDelete },
        });
        console.log(
          `✅ Deleted ${deleteResult.deletedCount} duplicate documents for chat_session_id: ${duplicate._id}`,
        );
      }
    }

    // 6. Liệt kê số lượng documents còn lại
    const totalCount = await collection.countDocuments();
    console.log(`📊 Total documents remaining: ${totalCount}`);

    // 7. Liệt kê một số documents mẫu
    const sampleDocs = await collection.find().limit(3).toArray();
    console.log('\n📋 Sample documents:');
    sampleDocs.forEach((doc, index) => {
      console.log(
        `  ${index + 1}. _id: ${doc._id}, chat_session_id: ${doc.chat_session_id}`,
      );
    });

    console.log('\n🎉 Database cleanup completed successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Chạy script
cleanupSessions().catch(console.error);
