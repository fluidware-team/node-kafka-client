import {
  InstrumentationEvent,
  Producer,
  ProducerEvents,
  ProducerRecord,
  RemoveInstrumentationEventListener,
  ValueOf
} from 'kafkajs';
import { Producer as GenericProducer } from '../interface';
import { getLogger } from '@fluidware-it/saddlebag';

export class KafkaProducer implements GenericProducer {
  private readonly producer: Producer;

  private readonly logger = getLogger().child({ component: 'kafka-producer' });

  private connected = false;

  private eventsListener: Record<string, RemoveInstrumentationEventListener<ValueOf<ProducerEvents>>[]> = {};

  constructor(producer: Producer) {
    this.producer = producer;
  }

  public async send({ topic, messages, acks, timeout, compression }: ProducerRecord): Promise<boolean> {
    this.logger.info(`Sending message: ${{ topic, messages, acks, timeout, compression }}`);
    if (!this.connected) {
      await this.connect();
    }
    try {
      await this.producer.send({
        topic,
        messages,
        acks,
        timeout,
        compression
      });
      return true;
    } catch (err) {
      this.logger.error(`Can't send message due to: ${err}`);
      return false;
    }
  }

  public on<T>(event: ValueOf<ProducerEvents>, listener: (event: InstrumentationEvent<T>) => void): void {
    const off = this.producer.on(event, listener);
    if (!this.eventsListener[event]) {
      this.eventsListener[event] = [];
    }
    this.eventsListener[event].push(off);
  }

  public off(event: ValueOf<ProducerEvents>): void {
    if (this.eventsListener[event]) {
      this.eventsListener[event].forEach(off => off());
      delete this.eventsListener[event];
    }
  }

  public async connect(): Promise<void> {
    if (!this.connected) {
      await this.producer.connect();
      this.connected = true;
    }
  }

  public async disconnect(): Promise<boolean> {
    if (!this.connected) return true;
    try {
      await this.producer.disconnect();
      this.connected = false;
      return true;
    } catch (err) {
      this.logger.error(`Error on disconnect due to: ${err}`);
    }
    return false;
  }
}
