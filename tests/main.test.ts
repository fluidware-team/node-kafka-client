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

import { getKafkaConfig } from '../src/config';
import { Authenticator } from 'kafkajs';

describe('getKafkaConfig', () => {
  let processEnv: NodeJS.ProcessEnv | undefined = undefined;

  function setProcessEnv(newEnv: NodeJS.ProcessEnv) {
    // eslint-disable-next-line no-process-env
    Object.assign(process.env, newEnv);
    processEnv = newEnv;
  }

  afterEach(() => {
    if (processEnv) {
      for (const key in processEnv) {
        // eslint-disable-next-line no-process-env
        delete process.env[key];
      }
      processEnv = undefined;
    }
  });

  it('should return config only from env (default)', () => {
    const envs = {
      KAFKA_BROKERS: 'broker1,broker2',
      KAFKA_CLIENT_ID: 'my-client-id'
    };
    setProcessEnv(envs);

    const config = getKafkaConfig({});
    expect(config).toEqual({
      brokers: ['broker1', 'broker2'],
      clientId: 'my-client-id',
      logLevel: 0,
      sasl: undefined,
      ssl: undefined
    });
  });

  it('should return config only from env (code)', () => {
    const envs = {
      KAFKA_BROKERS: 'broker1,broker2',
      KAFKA_CLIENT_ID: 'my-client-id',
      KAFKA_TESTA_BROKERS: 'broker-a1,broker-a2',
      KAFKA_TESTA_CLIENT_ID: 'my-client-a-id',
      KAFKA_TESTB_BROKERS: 'broker-b1,broker-b2',
      KAFKA_TESTB_CLIENT_ID: 'my-client-b-id'
    };
    setProcessEnv(envs);

    const config = getKafkaConfig({ code: 'TESTA' });
    expect(config).toEqual({
      brokers: ['broker-a1', 'broker-a2'],
      clientId: 'my-client-a-id',
      logLevel: 0,
      sasl: undefined,
      ssl: undefined
    });
  });

  it('should return merged config from env (code) and arg (ssl)', () => {
    const envs = {
      KAFKA_BROKERS: 'broker1,broker2',
      KAFKA_CLIENT_ID: 'my-client-id',
      KAFKA_TESTA_BROKERS: 'broker-a1,broker-a2',
      KAFKA_TESTA_CLIENT_ID: 'my-client-a-id',
      KAFKA_TESTB_BROKERS: 'broker-b1,broker-b2',
      KAFKA_TESTB_CLIENT_ID: 'my-client-b-id'
    };
    setProcessEnv(envs);

    const config = getKafkaConfig({ code: 'TESTA', kafkaConfig: { ssl: true } });
    expect(config).toEqual({
      brokers: ['broker-a1', 'broker-a2'],
      clientId: 'my-client-a-id',
      logLevel: 0,
      sasl: undefined,
      ssl: true
    });
  });

  it('should return config from env (code) (sasl/plain)', () => {
    const envs = {
      KAFKA_BROKERS: 'broker1,broker2',
      KAFKA_CLIENT_ID: 'my-client-id',
      KAFKA_TEST_SASL_BROKERS: 'broker-a1,broker-a2',
      KAFKA_TEST_SASL_CLIENT_ID: 'my-sasl-client-id',
      KAFKA_TEST_SASL_USE_SSL: 'true',
      KAFKA_TEST_SASL_SASL_MECHANISM: 'plain',
      KAFKA_TEST_SASL_SASL_USERNAME: 'user-a',
      KAFKA_TEST_SASL_SASL_PASSWORD: 'pass-a',
      KAFKA_TESTB_BROKERS: 'broker-b1,broker-b2',
      KAFKA_TESTB_CLIENT_ID: 'my-client-b-id'
    };
    setProcessEnv(envs);

    const config = getKafkaConfig({
      code: 'TEST_SASL'
    });
    expect(config).toEqual({
      brokers: ['broker-a1', 'broker-a2'],
      clientId: 'my-sasl-client-id',
      logLevel: 0,
      sasl: {
        mechanism: 'plain',
        username: 'user-a',
        password: 'pass-a'
      },
      ssl: true
    });
  });
  it('should return merged config from env (code) and arg (sasl/aws)', () => {
    const envs = {
      KAFKA_BROKERS: 'broker1,broker2',
      KAFKA_CLIENT_ID: 'my-client-id',
      KAFKA_TEST_AWS_BROKERS: 'broker-a1,broker-a2',
      KAFKA_TEST_AWS_CLIENT_ID: 'my-client-a-id',
      KAFKA_TEST_AWS_USE_SSL: 'true',
      KAFKA_TEST_AWS_SASL_MECHANISM: 'aws',
      KAFKA_TEST_AWS_SASL_AUTHORIZATION_ID: 'auth-id-a',
      KAFKA_TEST_AWS_SASL_ACCESS_KEY_ID: 'access-key-a',
      KAFKA_TEST_AWS_SASL_SECRET_ACCESS_KEY: 'secret-a',
      KAFKA_TESTB_BROKERS: 'broker-b1,broker-b2',
      KAFKA_TESTB_CLIENT_ID: 'my-client-b-id'
    };
    setProcessEnv(envs);

    const authenticationProvider = (): Authenticator => {
      return {
        authenticate: async () => {}
      };
    };
    const config = getKafkaConfig({
      code: 'TEST_AWS',
      kafkaConfig: {
        sasl: {
          mechanism: 'aws',
          authenticationProvider
        }
      }
    });
    expect(config).toEqual({
      brokers: ['broker-a1', 'broker-a2'],
      clientId: 'my-client-a-id',
      logLevel: 0,
      sasl: {
        mechanism: 'aws',
        authorizationIdentity: 'auth-id-a',
        accessKeyId: 'access-key-a',
        secretAccessKey: 'secret-a',
        authenticationProvider,
        sessionToken: undefined
      },
      ssl: true
    });
  });

  it('should return config from env (code) parsing SASL value from json string', () => {
    const envs = {
      KAFKA_BROKERS: 'broker1,broker2',
      KAFKA_CLIENT_ID: 'my-client-id',
      KAFKA_TEST_XXX_BROKERS: 'broker-a1,broker-a2',
      KAFKA_TEST_XXX_CLIENT_ID: 'my-client-a-id',
      KAFKA_TEST_XXX_USE_SSL: 'true',
      KAFKA_TEST_XXX_SASL: '{ "mechanism": "oauthbearer", "authenticationTimeout": 30000 }',
      KAFKA_TESTB_BROKERS: 'broker-b1,broker-b2',
      KAFKA_TESTB_CLIENT_ID: 'my-client-b-id'
    };
    setProcessEnv(envs);

    const oauthBearerProvider = async () => {
      // Use an unsecured token...
      const token = 'xxxx.yyyyy.zzzzz';

      return {
        value: token
      };
    };
    const config = getKafkaConfig({
      code: 'TEST_XXX',
      kafkaConfig: {
        sasl: {
          mechanism: 'oauthbearer',
          oauthBearerProvider
        }
      }
    });
    expect(config).toEqual({
      brokers: ['broker-a1', 'broker-a2'],
      clientId: 'my-client-a-id',
      logLevel: 0,
      sasl: {
        mechanism: 'oauthbearer',
        authenticationTimeout: 30000,
        oauthBearerProvider
      },
      ssl: true
    });
  });
});
