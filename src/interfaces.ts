import {
  ConsumerEvents,
  EachMessageHandler,
  InstrumentationEvent,
  ProducerEvents,
  ProducerRecord,
  ValueOf
} from 'kafkajs';

export interface Consumer {
  connect(): Promise<void>;
  setCallback(func: EachMessageHandler): void;
  disconnect(): Promise<boolean>;
  subscribe(topics: string[], autoCommit: boolean, fromBeginning: boolean): Promise<void>;
  on<T>(event: ValueOf<ConsumerEvents>, listener: (event: InstrumentationEvent<T>) => void): void;
  off(event: ValueOf<ConsumerEvents>): void;
}

export interface Producer {
  send(message: ProducerRecord): Promise<boolean>;
  connect(): Promise<void>;
  disconnect(): Promise<boolean>;
  on<T>(event: ValueOf<ProducerEvents>, listener: (event: InstrumentationEvent<T>) => void): void;
  off(event: ValueOf<ProducerEvents>): void;
}
