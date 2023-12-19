import { Consumer, Producer } from './interface';
import { ConsumerConfig, Kafka, ProducerConfig } from 'kafkajs';
import { KafkaProducer, KafkaConsumer } from './kafka';
import * as fs from 'fs';
import {
  KAFKA_BROKERS,
  KAFKA_CLIENT_ID,
  KAFKA_SSL_CA_PATH,
  KAFKA_SSL_CERT_PEM_PATH,
  KAFKA_SSL_KEY_PEM_PATH,
  KAFKA_SSL_REJECT_UNAUTHORIZED,
  KAFKA_USE_SSL
} from './config';
import * as tls from 'tls';

function getSSLConfig() {
  let sslConfig: boolean | tls.ConnectionOptions | undefined = undefined;
  if (KAFKA_USE_SSL) {
    if (!KAFKA_SSL_REJECT_UNAUTHORIZED) {
      sslConfig = {
        rejectUnauthorized: false
      };
    } else {
      if (KAFKA_SSL_CA_PATH && KAFKA_SSL_CERT_PEM_PATH && KAFKA_SSL_KEY_PEM_PATH) {
        sslConfig = {
          ca: [fs.readFileSync(KAFKA_SSL_CA_PATH, 'utf-8')],
          key: fs.readFileSync(KAFKA_SSL_KEY_PEM_PATH, 'utf-8'),
          cert: fs.readFileSync(KAFKA_SSL_CERT_PEM_PATH, 'utf-8')
        };
      } else {
        sslConfig = true;
      }
    }
  }
  return sslConfig;
}

const kafkaConfig = {
  clientId: KAFKA_CLIENT_ID,
  brokers: KAFKA_BROKERS.filter((s: string) => !!s),
  ssl: getSSLConfig()
};

function getKafka() {
  return new Kafka(kafkaConfig);
}

export class BrokerFactory {
  private static kafka: Kafka = getKafka();

  static producer(config?: ProducerConfig): Producer {
    const p = BrokerFactory.kafka.producer(config);
    return new KafkaProducer(p);
  }

  static consumer(config: ConsumerConfig): Consumer {
    const c = BrokerFactory.kafka.consumer(config);
    return new KafkaConsumer(c);
  }
}
