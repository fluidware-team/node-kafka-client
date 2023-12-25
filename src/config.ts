/*
 * Copyright Fluidware srl
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { EnvParse } from '@fluidware-it/saddlebag';
import { KafkaConfig } from 'kafkajs';
import * as tls from 'tls';
import * as fs from 'fs';

const memoizedOptions: { [prefix: string]: KafkaConfig } = {};

function getSSLConfig(prefix: string) {
  const KAFKA_USE_SSL = EnvParse.envBool(`KAFKA_${prefix}USE_SSL`, false);
  const KAFKA_SSL_REJECT_UNAUTHORIZED = EnvParse.envBool(`KAFKA_${prefix}SSL_REJECT_UNAUTHORIZED`, true);
  const KAFKA_SSL_CA_PATH = EnvParse.envString(`KAFKA_${prefix}SSL_CA_PATH`, '');
  const KAFKA_SSL_KEY_PEM_PATH = EnvParse.envString(`KAFKA_${prefix}SSL_KEY_PEM_PATH`, '');
  const KAFKA_SSL_CERT_PEM_PATH = EnvParse.envString(`KAFKA_${prefix}SSL_CERT_PEM_PATH`, '');
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

export function getKafkaConfig(instancePrefix?: string) {
  const prefixKey = instancePrefix ?? '_default_';
  const prefix = instancePrefix ? `${instancePrefix.toUpperCase()}_` : '';
  if (!memoizedOptions[prefixKey]) {
    // KAFKA_${prefix}CLIENT_ID: "prefix" is not required, can be used to have multiple kafka configurations: i.e: KAFKA_INSTANCE_A_CLIENT_ID=consumerA KAFKA_INSTANCE_B_CLIENT_ID=consumerB
    const KAFKA_CLIENT_ID = EnvParse.envStringRequired(`KAFKA_${prefix}CLIENT_ID`);
    const KAFKA_BROKERS = EnvParse.envStringList(`KAFKA_${prefix}BROKERS`, ['localhost:9092']);
    memoizedOptions[prefixKey] = {
      clientId: KAFKA_CLIENT_ID,
      brokers: KAFKA_BROKERS.map(s => s.trim()).filter((s: string) => !!s),
      ssl: getSSLConfig(prefix)
    };
  }
  return memoizedOptions[prefixKey];
}
