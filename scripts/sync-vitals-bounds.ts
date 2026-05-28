import { NestFactory } from '@nestjs/core';
import { DataSource, Entity, PrimaryColumn, Column } from 'typeorm';
import { Logger } from '@nestjs/common';

/**
 * @file sync-vitals-bounds.ts
 * @description Senior Backend Engineer implementation for synchronizing clinical vital boundaries.
 * This script seeds the database with standard medical safety thresholds if they don't exist.
 */

// Define the Entity locally if not importing from a shared library
@Entity('vital_range_configs')
class VitalRangeConfig {
  @PrimaryColumn()
  vitalType: string;

  @Column('float')
  minValue: number;

  @Column('float')
  maxValue: number;

  @Column({ nullable: true })
  errorMessage: string;
}

const CLINICAL_SAFETY_PROTOCOLS = [
  {
    vitalType: 'vitals_systolic',
    minValue: 50,
    maxValue: 250,
    errorMessage: 'Systolic BP must be between 50 and 250 mmHg for clinical safety.'
  },
  {
    vitalType: 'vitals_diastolic',
    minValue: 30,
    maxValue: 150,
    errorMessage: 'Diastolic BP must be between 30 and 150 mmHg for clinical safety.'
  },
  {
    vitalType: 'vitals_heartRate',
    minValue: 30,
    maxValue: 220,
    errorMessage: 'Heart Rate/Pulse must be between 30 and 220 BPM.'
  },
  {
    vitalType: 'vitals_oxygenLevel',
    minValue: 50,
    maxValue: 100,
    errorMessage: 'SpO2 level must be between 50% and 100%.'
  },
  {
    vitalType: 'vitals_weight',
    minValue: 2,
    maxValue: 300,
    errorMessage: 'Patient weight must be between 2kg and 300kg for standard intake.'
  },
  {
    vitalType: 'vitals_temperatureF',
    minValue: 94,
    maxValue: 108,
    errorMessage: 'Body temperature must be between 94°F and 108°F.'
  }
];

async function bootstrap() {
  const logger = new Logger('VitalsSync');
  logger.log('--- Clinical Vitals Boundary Synchronization Started ---');

  // Attempt to bootstrap from the main App Module to reuse DB configuration
  // Note: This assumes this script is placed in a directory where it can resolve your AppModule
  try {
    // In a real NestJS environment, you would import your AppModule:
    // import { AppModule } from './src/app.module';
    // const app = await NestFactory.createApplicationContext(AppModule);
    
    // For this standalone deliverable, we assume the execution context provides the DataSource
    // or we use the established NestJS pattern.
    
    // Placeholder for actual App Import - replace with your actual module path
    const { AppModule } = require('./src/app.module'); 
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);
    const repo = dataSource.getRepository(VitalRangeConfig);

    for (const protocol of CLINICAL_SAFETY_PROTOCOLS) {
      const existing = await repo.findOne({ where: { vitalType: protocol.vitalType } });

      if (!existing) {
        logger.log(`[SEED] Initializing missing key: ${protocol.vitalType}`);
        await repo.save(protocol);
      } else {
        logger.log(`[VERIFIED] Key exists: ${protocol.vitalType} (Managed via Admin Panel)`);
      }
    }

    logger.log('--- Clinical Vitals Boundary Synchronization Completed ---');
    await app.close();
  } catch (error) {
    logger.error('Synchronization failed due to context resolution error.');
    logger.error('Ensure this script is executed within the NestJS root or has access to AppModule.');
    logger.error(error.stack);
    process.exit(1);
  }
}

bootstrap();
