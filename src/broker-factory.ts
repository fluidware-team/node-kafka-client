import type { Consumer, Producer } from './interfaces';
import type { ConsumerConfig, ProducerConfig, KafkaConfig } from 'kafkajs';
import { Kafka } from 'kafkajs';
import { KafkaProducer, KafkaConsumer } from './kafka';
import { getKafkaConfig } from './config';

export class BrokerFactory {
  private static kafka: Record<string, Kafka> = {};

  private static setKafka(opts: { code?: string; kafkaConfig?: Partial<KafkaConfig> }) {
    const _code = opts.code ?? '_default_';
    if (!BrokerFactory.kafka[_code]) {
      const config = getKafkaConfig(opts);
      BrokerFactory.kafka[_code] = new Kafka(config);
    }
    return _code;
  }

  static producer(settings: {
    code?: string;
    producerConfig?: ProducerConfig;
    kafkaConfig?: Partial<KafkaConfig>;
  }): Producer;
  static producer(code: string): Producer;
  static producer(code: string, config: ProducerConfig): Producer;
  static producer(code: string, config: ProducerConfig, kafkaConfig: Partial<KafkaConfig>): Producer;
  static producer(code?: string, config?: ProducerConfig, kafkaConfig?: Partial<KafkaConfig>): Producer;
  static producer(
    codeOrSettings?: string | { code?: string; producerConfig?: ProducerConfig; kafkaConfig?: Partial<KafkaConfig> },
    producerConfig?: ProducerConfig,
    kafkaConfig?: Partial<KafkaConfig>
  ): Producer {
    const opts = typeof codeOrSettings === 'object' ? codeOrSettings : { code: codeOrSettings, kafkaConfig };
    const _code = BrokerFactory.setKafka(opts);
    const p = BrokerFactory.kafka[_code].producer(
      typeof codeOrSettings === 'object' ? codeOrSettings.producerConfig : producerConfig
    );
    return new KafkaProducer(p);
  }

  static consumer(config: ConsumerConfig): Consumer;
  static consumer(config: ConsumerConfig, settings: { code?: string; kafkaConfig?: Partial<KafkaConfig> }): Consumer;
  static consumer(config: ConsumerConfig, code: string): Consumer;
  static consumer(config: ConsumerConfig, code: string, kafkaConfig: Partial<KafkaConfig>): Consumer;
  static consumer(config: ConsumerConfig, code?: string, kafkaConfig?: Partial<KafkaConfig>): Consumer;
  static consumer(
    consumerConfig: ConsumerConfig,
    codeOrSettings?: string | { code?: string; kafkaConfig?: Partial<KafkaConfig> },
    kafkaConfig?: Partial<KafkaConfig>
  ): Consumer {
    const opts = typeof codeOrSettings === 'object' ? codeOrSettings : { code: codeOrSettings, kafkaConfig };
    const _code = BrokerFactory.setKafka(opts);
    const c = BrokerFactory.kafka[_code].consumer(consumerConfig);
    return new KafkaConsumer(c);
  }
}
