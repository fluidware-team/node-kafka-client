import { EachMessageHandler, ProducerRecord, Consumer as KafkaConsumer, Producer as KafkaProducer } from 'kafkajs';

export interface Consumer {
  connect(): Promise<void>;
  setCallback(func: EachMessageHandler): void;
  disconnect(): Promise<boolean>;
  subscribe(topics: string[], autoCommit: boolean, fromBeginning: boolean): Promise<void>;
  on: KafkaConsumer['on'];
}

export interface Producer {
  send(message: ProducerRecord): Promise<boolean>;
  connect(): Promise<void>;
  disconnect(): Promise<boolean>;
  on: KafkaProducer['on'];
}
