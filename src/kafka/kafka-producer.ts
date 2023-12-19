import { Producer, ProducerRecord } from 'kafkajs';
import { Producer as GenericProducer } from '../interface';
import { getLogger } from '@fluidware-it/saddlebag';

export class KafkaProducer implements GenericProducer {
  private readonly producer: Producer;

  private readonly logger = getLogger().child({ component: 'kafka-producer' });

  private connected = false;

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

  public async connect(): Promise<void> {
    if (!this.connected) {
      await this.producer.connect();
      this.connected = true;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.connected) return;
    try {
      await this.producer.disconnect();
      this.connected = false;
    } catch (err) {
      this.logger.error(`Error on disconnect due to: ${err}`);
    }
  }
}
