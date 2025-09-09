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
import type { KafkaConfig, SASLOptions } from 'kafkajs';
import { logLevel } from 'kafkajs';
import * as tls from 'tls';
import * as fs from 'fs';
import * as os from 'os';
import { merge } from 'ts-deepmerge';

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

function getSASLConfig(prefix: string): SASLOptions | undefined {
  // KAFKA_${prefix}SASL: if set, will take precedence over KAFKA_${prefix}SASL_MECHANISM. it must be a JSON string, refer to https://kafka.js.org/docs/configuration#sasl for the structure
  const KAFKA_SASL = EnvParse.envStringOptional(`KAFKA_${prefix}SASL`);
  if (KAFKA_SASL) {
    return JSON.parse(KAFKA_SASL) as SASLOptions;
  }
  // KAFKA_${prefix}SASL_MECHANISM: possible values are: 'plain', 'scram-sha-256', 'scram-sha-512', 'aws'
  const KAFKA_SASL_MECHANISM = EnvParse.envString(`KAFKA_${prefix}SASL_MECHANISM`, '').toLowerCase();
  if (!KAFKA_SASL_MECHANISM) {
    return;
  }
  switch (KAFKA_SASL_MECHANISM) {
    case 'plain':
    case 'scram-sha-256':
    case 'scram-sha-512': {
      const KAFKA_SASL_USERNAME = EnvParse.envString(`KAFKA_${prefix}SASL_USERNAME`, '');
      const KAFKA_SASL_PASSWORD = EnvParse.envString(`KAFKA_${prefix}SASL_PASSWORD`, '');
      if (KAFKA_SASL_USERNAME && KAFKA_SASL_PASSWORD) {
        return {
          mechanism: KAFKA_SASL_MECHANISM,
          username: KAFKA_SASL_USERNAME,
          password: KAFKA_SASL_PASSWORD
        };
      }
      return;
    }
    case 'aws': {
      const KAFKA_SASL_ACCESS_KEY_ID = EnvParse.envString(`KAFKA_${prefix}SASL_ACCESS_KEY_ID`, '');
      const KAFKA_SASL_SECRET_ACCESS_KEY = EnvParse.envString(`KAFKA_${prefix}SASL_SECRET_ACCESS_KEY`, '');
      const KAFKA_SASL_SESSION_TOKEN = EnvParse.envStringOptional(`KAFKA_${prefix}SASL_SESSION_TOKEN`);
      const KAFKA_SASL_AUTHORIZATION_ID = EnvParse.envString(`KAFKA_${prefix}SASL_AUTHORIZATION_ID`, '');
      if (KAFKA_SASL_AUTHORIZATION_ID && KAFKA_SASL_ACCESS_KEY_ID && KAFKA_SASL_SECRET_ACCESS_KEY) {
        return {
          mechanism: 'aws',
          authorizationIdentity: KAFKA_SASL_AUTHORIZATION_ID,
          accessKeyId: KAFKA_SASL_ACCESS_KEY_ID,
          secretAccessKey: KAFKA_SASL_SECRET_ACCESS_KEY,
          sessionToken: KAFKA_SASL_SESSION_TOKEN
        };
      }
      return;
    }
    default:
      throw new Error(
        'Invalid KAFKA_${prefix}SASL_MECHANISM, possible values are: plain, scram-sha-256, scram-sha-512, aws'
      );
  }
}

function remapLogLevel(logLevelString: string): logLevel {
  switch (logLevelString.toUpperCase()) {
    case 'NOTHING':
      return logLevel.NOTHING;
    case 'ERROR':
      return logLevel.ERROR;
    case 'WARN':
      return logLevel.WARN;
    case 'INFO':
      return logLevel.INFO;
    case 'DEBUG':
      return logLevel.DEBUG;
    default:
      return logLevel.NOTHING;
  }
}

export function getKafkaConfigFromEnv(instancePrefix?: string): KafkaConfig {
  const prefixKey = instancePrefix ?? '_default_';
  const prefix = instancePrefix ? `${instancePrefix.toUpperCase()}_` : '';
  if (!memoizedOptions[prefixKey]) {
    // KAFKA_${prefix}BROKERS: "prefix" is not required, can be used to have multiple kafka configurations: i.e: KAFKA_INSTANCE_A_BROKERS=kafka-a-01:9092,kafka-a-02:9092, KAFKA_INSTANCE_B_BROKERS=kafka-b-01:9092,kafka-b-02:9092
    const KAFKA_BROKERS = EnvParse.envStringList(`KAFKA_${prefix}BROKERS`, ['localhost:9092']);
    // KAFKA_${prefix}CLIENT_ID: default to `hostname()`
    const KAFKA_CLIENT_ID = EnvParse.envString(`KAFKA_${prefix}CLIENT_ID`, os.hostname());
    // KAFKA_${prefix}LOG_LEVEL: possible values: 'NOTHING', 'ERROR', 'WARN', 'INFO', 'DEBUG'
    const KAFKA_LOG_LEVEL = EnvParse.envString(`KAFKA_${prefix}LOG_LEVEL`, 'NOTHING');
    memoizedOptions[prefixKey] = {
      logLevel: remapLogLevel(KAFKA_LOG_LEVEL),
      clientId: KAFKA_CLIENT_ID,
      brokers: KAFKA_BROKERS.map(s => s.trim()).filter((s: string) => !!s),
      ssl: getSSLConfig(prefix),
      sasl: getSASLConfig(prefix)
    };
  }
  return memoizedOptions[prefixKey];
}

export function getKafkaConfig(opts: { code?: string; kafkaConfig?: Partial<KafkaConfig> }): KafkaConfig {
  const configFromEnv = getKafkaConfigFromEnv(opts.code);
  return merge.withOptions(
    { mergeArrays: false, allowUndefinedOverrides: false },
    configFromEnv,
    opts.kafkaConfig ?? {}
  ) as KafkaConfig;
}
