import { Consumer, Producer } from './interface';
import { ConsumerConfig, Kafka, ProducerConfig } from 'kafkajs';
import { KafkaProducer, KafkaConsumer } from './kafka';
import { getKafkaConfig } from './config';

export class BrokerFactory {
  private static kafka: Record<string, Kafka> = {};

  static producer(code?: string, config?: ProducerConfig): Producer {
    const _code = code ?? '_default_';
    if (!BrokerFactory.kafka[_code]) {
      BrokerFactory.kafka[_code] = new Kafka(getKafkaConfig(code));
    }
    const p = BrokerFactory.kafka[_code].producer(config);
    return new KafkaProducer(p);
  }

  static consumer(config: ConsumerConfig, code?: string): Consumer {
    const _code = code ?? '_default_';
    if (!BrokerFactory.kafka[_code]) {
      BrokerFactory.kafka[_code] = new Kafka(getKafkaConfig(code));
    }
    const c = BrokerFactory.kafka[_code].consumer(config);
    return new KafkaConsumer(c);
  }
}
