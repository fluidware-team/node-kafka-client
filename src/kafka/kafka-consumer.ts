import {
  Consumer,
  ConsumerEvents,
  EachMessageHandler,
  EachMessagePayload,
  InstrumentationEvent,
  RemoveInstrumentationEventListener,
  TopicPartitionOffsetAndMetadata,
  ValueOf
} from 'kafkajs';
import { Consumer as GenericConsumer } from '../interface';
import { getLogger } from '@fluidware-it/saddlebag';

export class KafkaConsumer implements GenericConsumer {
  private readonly consumer: Consumer;

  private readonly logger = getLogger().child({ component: 'kafka-consumer' });

  private connected = false;

  private eventsListener: Record<string, RemoveInstrumentationEventListener<ValueOf<ConsumerEvents>>[]> = {};

  private callback: EachMessageHandler = () => {
    throw new Error('EachMessagePayload must be override before connect() method call');
  };

  constructor(consumer: Consumer) {
    this.consumer = consumer;
  }

  public setCallback(func: EachMessageHandler): void {
    this.callback = func;
  }

  public async commitOffsets(topicsPartition: Array<TopicPartitionOffsetAndMetadata>): Promise<void> {
    return this.consumer.commitOffsets(topicsPartition);
  }

  public async subscribe(topics: string[], autoCommit = false, fromBeginning = true): Promise<void> {
    if (!this.connected) {
      await this.connect();
    }
    try {
      await this.consumer.subscribe({ topics, fromBeginning });
      await this.consumer.run({
        autoCommit,
        eachMessage: (payload: EachMessagePayload) => {
          return this.callback(payload);
        }
      });
    } catch (err) {
      this.logger.error(`Can't connect due to: ${err}`);
    }
  }

  public async connect(): Promise<void> {
    if (this.connected) return;
    await this.consumer.connect();
    this.connected = true;
    this.logger.info('connected');
  }

  public on<T>(event: ValueOf<ConsumerEvents>, listener: (event: InstrumentationEvent<T>) => void): void {
    const off = this.consumer.on(event, listener);
    if (!this.eventsListener[event]) {
      this.eventsListener[event] = [];
    }
    this.eventsListener[event].push(off);
  }

  public off(event: ValueOf<ConsumerEvents>) {
    if (this.eventsListener[event]) {
      this.eventsListener[event].forEach(off => off());
      delete this.eventsListener[event];
    }
  }

  public async disconnect(): Promise<boolean> {
    if (!this.connected) return true;
    try {
      await this.consumer.disconnect();
      this.connected = false;
      return true;
    } catch (err) {
      this.logger.error(`Error on disconnect due to: ${err}`);
    }
    return false;
  }
}
