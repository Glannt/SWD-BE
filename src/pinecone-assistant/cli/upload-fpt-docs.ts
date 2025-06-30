#!/usr/bin/env ts-node

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { PineconeAssistantService } from '../pinecone-assistant.service';
import * as path from 'path';
import * as fs from 'fs';

async function uploadFPTDocuments(assistantService?: PineconeAssistantService) {
  console.log('🚀 Starting FPT University Documents Upload to Pinecone Assistant...\n');

  try {
    let app;
    let service = assistantService;
    
    // Only create application context if service not provided (CLI mode)
    if (!service) {
      app = await NestFactory.createApplicationContext(AppModule);
      service = app.get(PineconeAssistantService);
    }

    // Check assistant status
    console.log('🔍 Checking Pinecone Assistant status...');
    const status = await service.getAssistantStatus();
    console.log(`📊 Assistant Status: ${status.status}`);
    console.log(`💾 Current files: ${status.fileCount}\n`);

    // Document path
    const docPath = path.join(process.cwd(), 'documents', 'THÔNG TIN ĐẠI HỌC FPT 2025.docx');
    
    // Check if file exists
    if (!fs.existsSync(docPath)) {
      console.error('❌ File not found:', docPath);
      console.log('Please ensure the document exists in the documents/ folder');
      process.exit(1);
    }

    console.log('📄 Found document:', docPath);
    console.log('📊 File size:', (fs.statSync(docPath).size / 1024 / 1024).toFixed(2), 'MB');

    // Upload document
    console.log('\n📤 Uploading document to Pinecone Assistant...');
    console.log('⏳ This may take several minutes depending on document size...\n');

    const uploadResponse = await service.uploadDocument(docPath, {
      documentType: 'university_information',
      university: 'FPT University',
      year: '2025',
      language: 'vietnamese',
      category: 'academic_guide',
      uploadedBy: 'system',
      uploadedAt: new Date().toISOString(),
    });

    console.log('✅ Document uploaded successfully!');
    console.log('📋 Upload Details:');
    console.log(`   • File ID: ${uploadResponse.id}`);
    console.log(`   • Status: ${uploadResponse.status}`);
    console.log(`   • Processing: ${uploadResponse.percentDone * 100}%`);

    // Wait for processing to complete
    if (uploadResponse.percentDone < 1) {
      console.log('\n⏳ Waiting for document processing to complete...');
      
      let processingComplete = false;
      let attempts = 0;
      const maxAttempts = 30; // 5 minutes max

      while (!processingComplete && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
        
        try {
          const files = await service.listFiles();
          const currentFile = files.files?.find(f => f.id === uploadResponse.id);
          
          if (currentFile) {
            const progress = currentFile.percentDone || 0;
            console.log(`   Processing: ${(progress * 100).toFixed(1)}%`);
            
            if (progress >= 1) {
              processingComplete = true;
              console.log('✅ Document processing completed!');
            }
          }
        } catch (error) {
          console.warn('⚠️ Could not check processing status:', error.message);
        }
        
        attempts++;
      }

      if (!processingComplete) {
        console.log('⚠️ Processing is taking longer than expected, but upload was successful');
        console.log('   The document will be available once processing completes');
      }
    }

    // Final status check
    console.log('\n📊 Final Assistant Status:');
    const finalStatus = await service.getAssistantStatus();
    console.log(`   • Total files: ${finalStatus.fileCount}`);
    console.log(`   • Assistant health: ${finalStatus.healthy ? '✅ Healthy' : '❌ Unhealthy'}`);

    console.log('\n🎉 Upload process completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Test the assistant by asking questions about FPT University');
    console.log('   2. Use the /assistant/chat endpoint to interact with the AI');
    console.log('   3. Monitor the assistant status via /assistant/status');

    // Only close app and exit if running in CLI mode
    if (app) {
      await app.close();
      process.exit(0);
    }

  } catch (error) {
    console.error('\n❌ Upload failed:', error.message);
    console.error('\n🔧 Troubleshooting tips:');
    console.error('   1. Check your PINECONE_API_KEY in environment variables');
    console.error('   2. Ensure you have sufficient Pinecone quota');
    console.error('   3. Verify the document file is accessible and not corrupted');
    console.error('   4. Check network connectivity to Pinecone services');
    
    // Only exit if running in CLI mode
    if (!assistantService) {
      process.exit(1);
    } else {
      throw error; // Re-throw for service to handle
    }
  }
}

// Run the upload script
if (require.main === module) {
  uploadFPTDocuments().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { uploadFPTDocuments }; 