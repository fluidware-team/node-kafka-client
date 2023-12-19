import { EachMessageHandler, ProducerRecord } from 'kafkajs';

export interface Consumer {
  connect(): Promise<void>;
  setCallback(func: EachMessageHandler): void;
  disconnect(): Promise<void>;
  subscribe(topics: string[], autoCommit: boolean, fromBeginning: boolean): Promise<void>;
}

export interface Producer {
  send(message: ProducerRecord): Promise<boolean>;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}
